-- =============================================================================
-- lookup_web_booking()  — add deposit/hold fields  — PayMongo Phase 2 prep
-- =============================================================================
-- ADDITIVE ONLY. Replaces lookup_web_booking (originally 20260612_05) so the
-- "My Reservations" / confirmation pages can render the deposit state:
--   "₱X paid · ₱Y due at the resort".
--
-- ONLY CHANGE vs the original: the returned jsonb now also carries
--   * amount_paid     — pesos already received (deposit), recomputed by
--                       mark_booking_paid from the booking_payments rows.
--   * hold_expires_at — when the 30-min unpaid hold lapses (null once paid or
--                       for non-web bookings). Lets the return page decide if a
--                       "retry payment" is still valid after a cancelled redirect.
--
-- No fields were removed or renamed, so existing callers keep working. Access is
-- unchanged: anon may call it, and it still returns ONE booking only when
-- booking_ref AND email both match.
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
    'booking_ref',     b.booking_ref,
    'status',          b.status,
    'check_in',        b.check_in,
    'check_out',       b.check_out,
    'num_guests',      b.num_guests,
    'total_amount',    b.total_amount,
    'amount_paid',     coalesce(b.amount_paid, 0),
    'payment_status',  b.payment_status,
    'hold_expires_at', b.hold_expires_at,
    'room_type',       r.room_type
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
