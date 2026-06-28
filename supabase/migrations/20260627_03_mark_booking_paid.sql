-- =============================================================================
-- mark_booking_paid()  — the verified-payment write path  — Phase 1, file 3 of 4
-- =============================================================================
-- Called ONLY by the paymongo-webhook Edge Function (as service_role) after it
-- verifies the PayMongo signature. NEVER granted to anon — a guest must not be
-- able to mark their own booking paid.
--
-- It is the single source of truth for "this booking received money":
--   1. records / updates the booking_payments row (idempotent on the checkout
--      session id — PayMongo retries webhooks),
--   2. recomputes amount_paid as the SUM of all 'paid' payment rows (so a
--      duplicate delivery can never double-count),
--   3. sets payment_status (partial for the 50% deposit, paid if fully paid),
--   4. confirms the booking and clears the hold.
--
-- RACE NOTE: a payment that lands just after expire_unpaid_holds() cancelled
-- the booking still wins here — real money was taken, so we re-confirm even a
-- 'cancelled' row. (Phase 2 sets the PayMongo session to expire before the hold
-- lapses, making this race very unlikely in practice.)
--
-- Returns jsonb: { booking_ref, status, payment_status, amount_paid, total_amount }.
-- Raises BOOKING_NOT_FOUND when the ref does not exist.
-- =============================================================================

create or replace function public.mark_booking_paid(
  p_booking_ref         text,
  p_checkout_session_id text,
  p_payment_id          text    default null,
  p_amount              numeric default null,
  p_currency            text    default 'PHP',
  p_raw                 jsonb   default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id   uuid;
  v_total        numeric;
  v_paid         numeric;
  v_pay_status   text;
begin
  if coalesce(btrim(p_booking_ref), '') = '' then
    raise exception 'BOOKING_REF_REQUIRED';
  end if;
  if coalesce(btrim(p_checkout_session_id), '') = '' then
    raise exception 'CHECKOUT_SESSION_REQUIRED';
  end if;

  select id, total_amount into v_booking_id, v_total
  from bookings
  where booking_ref = btrim(p_booking_ref)
  limit 1;

  if v_booking_id is null then
    raise exception 'BOOKING_NOT_FOUND';
  end if;

  -- ---- record the payment (idempotent on checkout_session_id) ---------------
  insert into booking_payments (
    booking_id, booking_ref, provider, checkout_session_id,
    payment_id, amount, currency, status, raw, updated_at
  ) values (
    v_booking_id, btrim(p_booking_ref), 'paymongo', btrim(p_checkout_session_id),
    nullif(btrim(coalesce(p_payment_id,'')), ''), p_amount, coalesce(p_currency,'PHP'),
    'paid', p_raw, now()
  )
  on conflict (checkout_session_id) where checkout_session_id is not null do update set
    payment_id = coalesce(nullif(btrim(coalesce(excluded.payment_id,'')), ''),
                          booking_payments.payment_id),
    amount     = coalesce(excluded.amount, booking_payments.amount),
    status     = 'paid',
    raw        = coalesce(excluded.raw, booking_payments.raw),
    updated_at = now();

  -- ---- recompute amount_paid from the source of truth -----------------------
  select coalesce(sum(amount), 0) into v_paid
  from booking_payments
  where booking_id = v_booking_id and status = 'paid';

  v_pay_status := case
                    when v_total is not null and v_paid >= v_total then 'paid'
                    when v_paid > 0                                 then 'partial'
                    else 'none'
                  end;

  -- ---- confirm the booking, release the hold --------------------------------
  update bookings
     set amount_paid     = v_paid,
         payment_status  = v_pay_status,
         status          = 'confirmed',
         hold_expires_at = null
   where id = v_booking_id;

  return jsonb_build_object(
    'booking_ref',    p_booking_ref,
    'status',         'confirmed',
    'payment_status', v_pay_status,
    'amount_paid',    v_paid,
    'total_amount',   v_total
  );
end;
$$;

-- Webhook-only. service_role bypasses RLS; anon must NOT be able to call this.
revoke all on function
  public.mark_booking_paid(text, text, text, numeric, text, jsonb) from public;
grant execute on function
  public.mark_booking_paid(text, text, text, numeric, text, jsonb) to service_role;
