-- =============================================================================
-- lookup_web_booking()  — "My Reservations" read path
-- =============================================================================
-- Direct anon reads of bookings are denied by RLS (PII protection). This
-- SECURITY DEFINER RPC returns ONE booking, and only when booking_ref AND the
-- guest's email both match. It returns a curated set of guest-safe fields —
-- never other guests' data, never internal-only columns.
--
-- Returns jsonb of the booking, or NULL when nothing matches.
-- =============================================================================

create or replace function public.lookup_web_booking(
  p_booking_ref text,
  p_email       text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if coalesce(btrim(p_booking_ref), '') = '' or coalesce(btrim(p_email), '') = '' then
    return null;
  end if;

  select jsonb_build_object(
    'booking_ref',    b.booking_ref,
    'status',         b.status,
    'check_in',       b.check_in,
    'check_out',      b.check_out,
    'num_guests',     b.num_guests,
    'total_amount',   b.total_amount,
    'payment_status', b.payment_status,
    'room_type',      r.room_type
  )
  into v_result
  from bookings b
  join guests g on g.id = b.guest_id
  left join rooms r on r.id = b.room_id
  where b.booking_ref = btrim(p_booking_ref)
    and lower(g.email) = lower(btrim(p_email))
  limit 1;

  return v_result; -- null when not found
end;
$$;

revoke all on function public.lookup_web_booking(text, text) from public;
grant execute on function public.lookup_web_booking(text, text) to anon;
