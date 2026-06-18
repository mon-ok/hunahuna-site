# Hunahuna Beach Resort — Website

Marketing site + booking platform for Hunahuna Beach Resort. React (Vite) + SCSS
front end against an **existing, shared** Supabase project (the POS/staff app and
KPI dashboard are separate clients on the same database). This client reads and
writes only a guest-facing subset and treats the schema as fixed.

## Stack
- React 18 + Vite, React Router
- SCSS (modular partials, `@use`) — tropical sunset theme derived from the logo
- `@supabase/supabase-js` (anon key only) + TanStack React Query
- React Hook Form for the booking and contact forms

## Getting started
```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key
npm run dev
```

### Environment
| Var | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Supabase project + **anon** key (never service_role) |
| `VITE_BUCKET_ROOMS` / `VITE_BUCKET_MENU` / `VITE_BUCKET_GALLERY` | Storage bucket names — **confirm with the team** |
| `VITE_BOOKING_ENABLED` | `true` to enable live booking writes (see gate below) |
| `VITE_CONTACT_EMAIL` / `VITE_CONTACT_PHONE` / `VITE_CONTACT_ADDRESS` | Contact page details |

## Project structure
```
src/
  components/   Navbar, Footer, RoomCard, RoomGallery, MenuSection, AmenityCard,
                GalleryGrid, Lightbox, BookingForm, Image, PageHeader, States
  pages/        Home, Rooms, RoomDetail, Menu, Amenities, Gallery, About,
                Contact, Booking, BookingConfirmation, MyReservations, NotFound
  hooks/        useRooms, useRoom, useMenu, useAmenities, useGallery,
                useAvailability (+ useRateQuote), useCreateBooking,
                useReservationLookup
  lib/          supabaseClient.js, storage.js (path -> public URL),
                queryClient.js, rates.js (DISPLAY-ONLY rate helpers)
  styles/       _variables, _mixins, _base, global.scss
supabase/migrations/   RLS + RPCs (the backend trio + write-path RPCs)
```

Notes:
- All images go through `lib/storage.js` (`publicUrl`), are lazy-loaded, and
  always carry `alt_text` (rooms) / `caption` (gallery).
- Rates shown client-side (`lib/rates.js`) are **estimates only**. The
  authoritative total is computed server-side and re-derived at insert time.
- Weekend = **Fri & Sat** in both `lib/rates.js` and `calculate_booking_rate`.
  Keep them in sync if you change it.

## ⚠️ Booking gate — outstanding backend items

The front end runs read-only out of the box. **Live booking writes stay disabled
(`VITE_BOOKING_ENABLED=false`) until the backend is applied.** SQL for all of it
lives in `supabase/migrations/` — apply via the Supabase SQL editor or CLI, in
order, after reviewing against the live schema.

1. **RLS policies** — `20260612_01_web_rls_policies.sql`
   Anon SELECT on active rows of `rooms`, `room_images`, `menu_items`,
   `amenities`, `gallery_images`. No direct anon access to `guests`/`bookings`
   (writes go through the RPC). Full deny on `orders`, `order_items`,
   `conversation_history`, `rate_limit`.
2. **Availability RPC** — `20260612_02_check_room_availability.sql`
   **Decision applied: a `pending` booking blocks dates** (blocking statuses =
   pending, confirmed, rescheduled).
3. **Rate RPC** — `20260612_03_calculate_booking_rate.sql`
   Weekday/weekend tiers. **Holidays deferred:** `is_holiday()` is a stub that
   returns false — wire it to a holidays table or manual flag when decided;
   nothing else needs to change.

Plus the two write-path RPCs the booking flow calls:
- `20260612_04_create_web_booking.sql` — the single constrained insert path
  (validates, locks per-room, re-checks availability, recomputes total, upserts
  guest with `source='web'`, inserts booking with `booking_channel='web'`,
  `booking_timing='ahead'`, `status='pending'`, `payment_status='none'`).
- `20260612_05_lookup_web_booking.sql` — "My Reservations" lookup by
  `booking_ref` + email (no direct table read).

### Before applying
- **ID type:** the RPC signatures assume a `uuid` `rooms` PK. If it's `bigint`,
  change `uuid` → `bigint` in the function args and recreate them. Match the
  actual `guests`/`bookings` FK types too.
- **Shared DB:** enabling RLS affects the POS/dashboard. They must connect as
  `service_role` or authenticated staff (both bypass / are governed separately
  by RLS) — coordinate before applying on production.
- **Storage:** the room/menu/gallery buckets must allow public read for
  `getPublicUrl` to resolve (or add a storage read policy for `anon`).

Once the migrations are applied and verified, set `VITE_BOOKING_ENABLED=true`.

## Scripts
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run preview` — preview the build
# hunahuna-site
