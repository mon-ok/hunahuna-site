-- =============================================================================
-- Online deposit-payment schema (PayMongo)  — Phase 1, file 1 of 4
-- =============================================================================
-- ADDITIVE ONLY. Safe to apply on the shared DB: this adds one nullable column
-- to `bookings` and creates one new table. It changes no existing behaviour for
-- the POS / admin / dashboard clients.
--
-- ⚠️ ID TYPE: `booking_payments.booking_id` is declared `uuid` to match the
-- assumed `bookings` PK (consistent with the other web RPCs). If `bookings.id`
-- is `bigint`, change the column + FK type here before applying.
-- =============================================================================

-- --- bookings.hold_expires_at -------------------------------------------------
-- When set, a web 'pending' booking holds its room (pending blocks dates) only
-- until this moment. If still unpaid past it, expire_unpaid_holds() cancels it
-- so the dates free up. Cleared (set null) the moment a payment is recorded.
alter table public.bookings
  add column if not exists hold_expires_at timestamptz;

comment on column public.bookings.hold_expires_at is
  'Web online-payment hold deadline. If status=pending and unpaid past this '
  'time, expire_unpaid_holds() auto-cancels the booking. Null once paid or for '
  'bookings not created through the web payment flow.';

-- --- booking_payments ---------------------------------------------------------
-- Audit trail of PayMongo interactions. One row per checkout session: created
-- 'pending' when the session is opened (Phase 2), flipped to 'paid' by the
-- verified webhook (via mark_booking_paid). `raw` keeps the source payload so
-- the admin app has a full record without talking to PayMongo.
create table if not exists public.booking_payments (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid not null references public.bookings(id) on delete cascade,
  booking_ref         text not null,
  provider            text not null default 'paymongo',
  checkout_session_id text,
  payment_id          text,
  amount              numeric(12,2),                 -- PHP, not centavos
  currency            text not null default 'PHP',
  status              text not null default 'pending', -- pending|paid|failed|expired|refunded
  raw                 jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Correlation/idempotency keys. checkout_session_id is the primary dedup key
-- (the webhook payload carries it and matches the row opened in Phase 2);
-- payment_id is unique when present.
create unique index if not exists booking_payments_session_uniq
  on public.booking_payments (checkout_session_id) where checkout_session_id is not null;
create unique index if not exists booking_payments_payment_uniq
  on public.booking_payments (payment_id) where payment_id is not null;
create index if not exists booking_payments_booking_idx
  on public.booking_payments (booking_id);
create index if not exists booking_payments_ref_idx
  on public.booking_payments (booking_ref);

-- Sensitive (payment references). No anon access at all — mirrors the deny on
-- orders/bookings. Writes happen only through service_role (Edge Functions) and
-- the SECURITY DEFINER mark_booking_paid RPC.
alter table public.booking_payments enable row level security;
revoke all on public.booking_payments from anon;
grant all on public.booking_payments to service_role;
