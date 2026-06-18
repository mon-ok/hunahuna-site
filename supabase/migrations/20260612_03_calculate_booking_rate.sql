-- =============================================================================
-- calculate_booking_rate()  (outstanding backend item #3)
-- =============================================================================
-- Authoritative per-stay rate. Iterates each night from check_in (inclusive)
-- to check_out (exclusive) and sums the applicable tier rate.
--
-- Weekend nights = Friday & Saturday  (extract(dow) in (5, 6); 0 = Sunday).
-- This MUST match the client display helper in src/lib/rates.js.
--
-- HOLIDAYS ARE DEFERRED. The team will decide the source later (a holidays
-- dates table vs a manual flag). Until then is_holiday() returns false, so no
-- night is charged the holiday rate. When the source is chosen, replace the
-- body of is_holiday() only — this function needs no further change.
--
-- Tier fallbacks: holiday -> weekend -> weekday -> base_rate.
-- Returns jsonb: { nights, total_amount, avg_rate }.
-- =============================================================================

-- --- Holiday hook (placeholder until the holiday source is decided) ----------
create or replace function public.is_holiday(p_date date)
returns boolean
language sql
immutable
as $$
  -- TODO(holidays): holiday source not yet decided. Treat nothing as a holiday.
  -- When decided, replace with one of, e.g.:
  --   select exists (select 1 from public.holidays h where h.holiday_date = p_date);
  -- or a manual-flag lookup. Keep this function IMMUTABLE-compatible.
  select false;
$$;

-- --- Rate calculator ----------------------------------------------------------
create or replace function public.calculate_booking_rate(
  p_room_id  uuid,
  p_check_in  date,
  p_check_out date
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room   rooms%rowtype;
  v_day    date;
  v_nights integer := 0;
  v_total  numeric := 0;
  v_rate   numeric;
begin
  if p_check_in is null or p_check_out is null or p_check_out <= p_check_in then
    raise exception 'INVALID_DATE_RANGE' using errcode = '22007';
  end if;

  select * into v_room from rooms where id = p_room_id and is_active = true;
  if not found then
    raise exception 'ROOM_NOT_FOUND' using errcode = 'P0002';
  end if;

  v_day := p_check_in;
  while v_day < p_check_out loop
    if public.is_holiday(v_day) then
      v_rate := coalesce(v_room.holiday_rate, v_room.weekend_rate,
                         v_room.weekday_rate, v_room.base_rate);
    elsif extract(dow from v_day) in (5, 6) then       -- Fri / Sat
      v_rate := coalesce(v_room.weekend_rate, v_room.weekday_rate, v_room.base_rate);
    else
      v_rate := coalesce(v_room.weekday_rate, v_room.base_rate);
    end if;

    if v_rate is null then
      raise exception 'NO_RATE_DEFINED' using errcode = '22004';
    end if;

    v_total  := v_total + v_rate;
    v_nights := v_nights + 1;
    v_day    := v_day + 1;
  end loop;

  return jsonb_build_object(
    'nights',       v_nights,
    'total_amount', v_total,
    'avg_rate',     case when v_nights > 0 then round(v_total / v_nights, 2) else 0 end
  );
end;
$$;

revoke all on function public.is_holiday(date) from public;
grant execute on function public.is_holiday(date) to anon;

revoke all on function public.calculate_booking_rate(uuid, date, date) from public;
grant execute on function public.calculate_booking_rate(uuid, date, date) to anon;
