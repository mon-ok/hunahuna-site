-- =============================================================================
-- create_web_booking()  — the website's single constrained write path
-- =============================================================================
-- The anon client cannot insert into guests/bookings directly (RLS denies it).
-- This SECURITY DEFINER RPC is the only way the website creates a reservation.
-- It:
--   1. validates inputs and occupancy,
--   2. takes a per-room transaction lock to prevent double-booking races,
--   3. re-checks availability authoritatively (pending blocks),
--   4. recomputes the total server-side (never trusts the client),
--   5. upserts the guest with source = 'web',
--   6. generates a unique booking_ref,
--   7. inserts the booking as channel='web', timing='ahead', status='pending',
--      payment_status='none'.
--
-- Returns jsonb: { booking_ref, total_amount, nights, status }.
-- Raises typed exceptions the front end surfaces:
--   NAME_REQUIRED, INVALID_EMAIL, INVALID_DATE_RANGE, CHECK_IN_IN_PAST,
--   ROOM_NOT_FOUND, OVER_OCCUPANCY, ROOM_UNAVAILABLE, REF_GENERATION_FAILED.
--
-- NOTE on promo_code: stored as-given; discount_amount is left 0. Promo
-- validation/redemption is a future enhancement (staff apply discounts in POS).
-- =============================================================================

create or replace function public.create_web_booking(
  p_full_name  text,
  p_email      text,
  p_phone      text,
  p_room_id    uuid,
  p_check_in   date,
  p_check_out  date,
  p_num_guests integer,
  p_promo_code text default null,
  p_notes      text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room     rooms%rowtype;
  v_guest_id uuid;
  v_rate     jsonb;
  v_total    numeric;
  v_nights   integer;
  v_avg      numeric;
  v_ref      text;
  v_attempts integer := 0;
begin
  -- ---- validate -------------------------------------------------------------
  if coalesce(btrim(p_full_name), '') = '' then
    raise exception 'NAME_REQUIRED';
  end if;
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'INVALID_EMAIL';
  end if;
  if p_check_in is null or p_check_out is null or p_check_out <= p_check_in then
    raise exception 'INVALID_DATE_RANGE';
  end if;
  if p_check_in < current_date then
    raise exception 'CHECK_IN_IN_PAST';
  end if;

  select * into v_room from rooms where id = p_room_id and is_active = true;
  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;
  if p_num_guests < 1 or p_num_guests > v_room.max_occupancy then
    raise exception 'OVER_OCCUPANCY';
  end if;

  -- ---- serialize bookings for this room to close the check-then-insert race -
  perform pg_advisory_xact_lock(hashtextextended(p_room_id::text, 0));

  -- ---- authoritative availability (pending blocks) --------------------------
  if not public.check_room_availability(p_room_id, p_check_in, p_check_out) then
    raise exception 'ROOM_UNAVAILABLE';
  end if;

  -- ---- authoritative total --------------------------------------------------
  v_rate   := public.calculate_booking_rate(p_room_id, p_check_in, p_check_out);
  v_total  := (v_rate ->> 'total_amount')::numeric;
  v_nights := (v_rate ->> 'nights')::integer;
  v_avg    := (v_rate ->> 'avg_rate')::numeric;

  -- ---- upsert guest by email ------------------------------------------------
  -- Match an existing guest by email. (No ordering column assumed beyond the
  -- documented schema; if duplicate emails exist, the first match is reused.)
  select id into v_guest_id
  from guests
  where lower(email) = lower(p_email)
  limit 1;

  if v_guest_id is null then
    insert into guests (full_name, email, phone, source)
    values (btrim(p_full_name), p_email, nullif(btrim(coalesce(p_phone,'')), ''), 'web')
    returning id into v_guest_id;
  else
    update guests
       set full_name = coalesce(nullif(btrim(p_full_name), ''), full_name),
           phone     = coalesce(nullif(btrim(coalesce(p_phone,'')), ''), phone)
     where id = v_guest_id;
  end if;

  -- ---- unique booking_ref ---------------------------------------------------
  loop
    v_attempts := v_attempts + 1;
    v_ref := 'HH-' || to_char(current_date, 'YYYY') || '-' ||
             upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from bookings where booking_ref = v_ref);
    if v_attempts > 10 then
      raise exception 'REF_GENERATION_FAILED';
    end if;
  end loop;

  -- ---- insert booking -------------------------------------------------------
  insert into bookings (
    guest_id, room_id, booking_ref, check_in, check_out, num_guests,
    rate_at_booking, total_amount, payment_status, amount_paid,
    discount_amount, promo_code, booking_channel, booking_timing,
    status, notes
  ) values (
    v_guest_id, p_room_id, v_ref, p_check_in, p_check_out, p_num_guests,
    v_avg, v_total, 'none', 0,
    0, nullif(btrim(coalesce(p_promo_code,'')), ''), 'web', 'ahead',
    'pending', nullif(btrim(coalesce(p_notes,'')), '')
  );

  return jsonb_build_object(
    'booking_ref',  v_ref,
    'total_amount', v_total,
    'nights',       v_nights,
    'status',       'pending'
  );
end;
$$;

revoke all on function
  public.create_web_booking(text, text, text, uuid, date, date, integer, text, text)
  from public;
grant execute on function
  public.create_web_booking(text, text, text, uuid, date, date, integer, text, text)
  to anon;
