// Client-side availability helpers for the booking calendar.
//
// The authoritative check still happens server-side in `create_web_booking`
// at submit time. These functions only drive the calendar UI: which nights to
// paint available/booked, and which concrete room of a type to attach to a
// reservation. They read the `bookings` table directly (anon-readable).
//
// Blocking statuses match the backend decision: pending, confirmed, and
// rescheduled all hold a room; cancelled / no-show / checked-out do not.
export const BLOCKING_STATUSES = new Set(['pending', 'confirmed', 'rescheduled'])

// ---- date helpers (local, YYYY-MM-DD) ---------------------------------------
export function ymd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseYmd(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date, n) {
  const x = new Date(date)
  x.setDate(x.getDate() + n)
  return x
}

export function todayYmd() {
  return ymd(new Date())
}

// ---- availability logic ------------------------------------------------------
// A booking occupies nights [check_in, check_out). It conflicts with a
// requested range [inStr, outStr) when the two intervals overlap.
export function bookingBlocksRange(booking, inStr, outStr) {
  return booking.check_in < outStr && booking.check_out > inStr
}

function isBlocking(booking) {
  return BLOCKING_STATUSES.has(booking.status)
}

// Is one specific room free for the whole requested range?
export function roomFreeForRange(roomId, bookings, inStr, outStr) {
  return !bookings.some(
    (b) => b.room_id === roomId && isBlocking(b) && bookingBlocksRange(b, inStr, outStr)
  )
}

// First room (of a type) with no conflict across the entire range — this is the
// concrete room we attach to the reservation. Returns its id, or null if the
// whole type is taken for those dates.
export function firstFreeRoom(rooms, bookings, inStr, outStr) {
  const free = rooms.find((r) => roomFreeForRange(r.id, bookings, inStr, outStr))
  return free?.id ?? null
}

// For the calendar: is *any* room of the set free on the single night `dateStr`?
export function anyRoomFreeOnNight(rooms, bookings, dateStr) {
  const next = ymd(addDays(parseYmd(dateStr), 1))
  return rooms.some((r) => roomFreeForRange(r.id, bookings, dateStr, next))
}

// Every night in [inStr, outStr) has at least one free room of the type.
export function rangeHasNightlyAvailability(rooms, bookings, inStr, outStr) {
  let cursor = parseYmd(inStr)
  const end = parseYmd(outStr)
  while (cursor < end) {
    if (!anyRoomFreeOnNight(rooms, bookings, ymd(cursor))) return false
    cursor = addDays(cursor, 1)
  }
  return true
}
