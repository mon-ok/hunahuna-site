-- =============================================================================
-- Website RLS policies  (outstanding backend item #1)
-- =============================================================================
-- Scope: lock the shared database down to a safe guest-facing subset for the
-- anonymous (anon) website client. The POS/staff app and KPI dashboard are
-- separate clients and should connect with service_role or authenticated staff
-- roles, both of which BYPASS RLS — so enabling RLS here does not remove their
-- access. Coordinate with the team before applying on a live database.
--
-- Model:
--   * Content tables  -> anon SELECT on ACTIVE rows only.
--   * guests/bookings -> NO direct anon access; all writes go through the
--                        SECURITY DEFINER create_web_booking() RPC and reads
--                        through lookup_web_booking().
--   * orders / order_items / conversation_history / rate_limit -> fully denied
--                        to anon.
-- =============================================================================

-- ---- Content tables: read-only on active rows --------------------------------

alter table public.rooms enable row level security;
drop policy if exists web_anon_read_rooms on public.rooms;
create policy web_anon_read_rooms
  on public.rooms for select to anon
  using (is_active = true);

alter table public.room_images enable row level security;
drop policy if exists web_anon_read_room_images on public.room_images;
-- room_images has no is_active flag; gate on the parent room being active.
create policy web_anon_read_room_images
  on public.room_images for select to anon
  using (exists (
    select 1 from public.rooms r
    where r.id = room_images.room_id and r.is_active = true
  ));

alter table public.menu_items enable row level security;
drop policy if exists web_anon_read_menu_items on public.menu_items;
create policy web_anon_read_menu_items
  on public.menu_items for select to anon
  using (is_available = true);

alter table public.amenities enable row level security;
drop policy if exists web_anon_read_amenities on public.amenities;
create policy web_anon_read_amenities
  on public.amenities for select to anon
  using (is_active = true);

alter table public.gallery_images enable row level security;
drop policy if exists web_anon_read_gallery_images on public.gallery_images;
create policy web_anon_read_gallery_images
  on public.gallery_images for select to anon
  using (is_active = true);

-- ---- guests / bookings: no direct anon access -------------------------------
-- RLS enabled with NO anon policy => every direct anon query is denied.
-- The website never touches these tables directly; it calls the RPCs below,
-- which are SECURITY DEFINER and therefore run with the function owner's rights.

alter table public.guests   enable row level security;
alter table public.bookings enable row level security;

revoke all on public.guests   from anon;
revoke all on public.bookings from anon;

-- ---- Off-limits tables: deny anon entirely ----------------------------------

alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.conversation_history enable row level security;
alter table public.rate_limit           enable row level security;

revoke all on public.orders               from anon;
revoke all on public.order_items          from anon;
revoke all on public.conversation_history from anon;
revoke all on public.rate_limit           from anon;

-- Function execute grants are issued in each function's migration file.
