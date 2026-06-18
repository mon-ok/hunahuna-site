-- =============================================================================
-- check_room_availability()  (outstanding backend item #2)
-- =============================================================================
-- Returns TRUE when the room is free for the requested range.
--
-- DECISION (confirmed with the team): a PENDING booking DOES block dates.
-- Blocking statuses are therefore: pending, confirmed, rescheduled.
-- 'cancelled' and 'completed' do not block.
--
-- Overlap rule (half-open ranges; check_out is the departure day, not a night):
--     existing.check_in < requested.check_out
--     AND existing.check_out > requested.check_in
--
-- SECURITY DEFINER so the anon client can call it without read access to the
-- bookings table — it only ever returns a boolean, never row data.
--
-- ID TYPE NOTE: p_room_id is declared `uuid`. If the rooms PK is a bigint
-- identity column instead, change `uuid` -> `bigint` here AND in every other
-- function in this folder, then re-create them.
-- =============================================================================

create or replace function public.check_room_availability(
  p_room_id  uuid,
  p_check_in  date,
  p_check_out date
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conflicts integer;
begin
  if p_check_in is null or p_check_out is null or p_check_out <= p_check_in then
    raise exception 'INVALID_DATE_RANGE' using errcode = '22007';
  end if;

  -- Unknown / inactive rooms are treated as not bookable.
  if not exists (select 1 from rooms where id = p_room_id and is_active = true) then
    return false;
  end if;

  select count(*)
    into v_conflicts
  from bookings b
  where b.room_id = p_room_id
    and b.status in ('pending', 'confirmed', 'rescheduled')
    and b.check_in  < p_check_out
    and b.check_out > p_check_in;

  return v_conflicts = 0;
end;
$$;

revoke all on function public.check_room_availability(uuid, date, date) from public;
grant execute on function public.check_room_availability(uuid, date, date) to anon;
