-- =============================================================================
-- expire_unpaid_holds()  — reclaim abandoned holds  — Phase 1, file 4 of 4
-- =============================================================================
-- A web 'pending' booking blocks its room (pending blocks dates). If the guest
-- never pays the deposit, the hold must lapse so the dates free up. This cancels
-- every web booking whose hold deadline has passed and that has received no
-- money. It is deliberately narrow:
--   * booking_channel = 'web'        (never touches POS / admin bookings)
--   * status          = 'pending'    (confirmed/rescheduled are untouched)
--   * no payment yet  (payment_status 'none' AND amount_paid 0)
--   * hold_expires_at is set and in the past
--
-- Idempotent and safe to run on any cadence. Returns the number cancelled.
-- mark_booking_paid() always wins any race against this (see file 3).
-- =============================================================================

create or replace function public.expire_unpaid_holds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with cancelled as (
    update bookings
       set status          = 'cancelled',
           hold_expires_at = null
     where booking_channel = 'web'
       and status          = 'pending'
       and coalesce(payment_status, 'none') = 'none'
       and coalesce(amount_paid, 0) = 0
       and hold_expires_at is not null
       and hold_expires_at < now()
    returning 1
  )
  select count(*) into v_count from cancelled;

  return v_count;
end;
$$;

-- Automation/service-role only — not anon.
revoke all on function public.expire_unpaid_holds() from public;
grant execute on function public.expire_unpaid_holds() to service_role;

-- =============================================================================
-- Schedule (pg_cron)
-- =============================================================================
-- Requires the pg_cron extension. On Supabase, enable it once via
--   Dashboard → Database → Extensions → pg_cron
-- (or `create extension if not exists pg_cron;` as a superuser). Then the block
-- below registers a once-a-minute sweep. It is guarded so re-applying this
-- migration won't create duplicate jobs.
--
-- If you'd rather not use pg_cron, schedule expire_unpaid_holds() any other way
-- (e.g. a Supabase Scheduled Function / external cron hitting an RPC). The
-- function above is the only thing that must run; the schedule is replaceable.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('expire-unpaid-holds')
      where exists (select 1 from cron.job where jobname = 'expire-unpaid-holds');
    perform cron.schedule(
      'expire-unpaid-holds',
      '* * * * *',
      'select public.expire_unpaid_holds()'
    );
  else
    raise notice 'pg_cron not installed — enable it and re-run this block, or schedule expire_unpaid_holds() externally.';
  end if;
end
$$;
