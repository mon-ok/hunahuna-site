// CLIENT-SIDE rate helpers — for DISPLAY ESTIMATES ONLY.
//
// The authoritative rate is computed server-side by the `calculate_booking_rate`
// RPC and re-derived inside `create_web_booking` at insert time. Never persist a
// total computed here. These functions exist so the UI can show a "from" price
// and a live estimate while the guest picks dates.
//
// Weekend nights are defined here as Friday and Saturday (the night of stay).
// This MUST match the SQL definition in calculate_booking_rate; if you change
// one, change the other. Holidays are NOT handled client-side — they are
// deferred and resolved server-side once the holiday source is decided.

const formatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

export function formatMoney(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return ''
  return formatter.format(Number(value))
}

// Lowest nightly rate across the tiers — used for "from {price}/night" labels.
export function representativeRate(room) {
  const tiers = [room?.weekday_rate, room?.weekend_rate, room?.base_rate].filter(
    (n) => n !== null && n !== undefined
  )
  if (!tiers.length) return null
  return Math.min(...tiers.map(Number))
}

function isWeekendNight(date) {
  const d = date.getDay() // 0 Sun … 6 Sat
  return d === 5 || d === 6 // Fri or Sat
}

function nightlyRate(room, date) {
  if (isWeekendNight(date)) {
    return Number(room.weekend_rate ?? room.weekday_rate ?? room.base_rate)
  }
  return Number(room.weekday_rate ?? room.base_rate)
}

/**
 * Estimate a stay total for display. Iterates each night from check_in
 * (inclusive) to check_out (exclusive). Returns null if dates are invalid.
 */
export function estimateStay(room, checkIn, checkOut) {
  if (!room || !checkIn || !checkOut) return null
  const start = new Date(`${checkIn}T00:00:00`)
  const end = new Date(`${checkOut}T00:00:00`)
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null

  let total = 0
  const breakdown = []
  const cursor = new Date(start)
  while (cursor < end) {
    const rate = nightlyRate(room, cursor)
    total += rate
    breakdown.push({
      date: cursor.toISOString().slice(0, 10),
      weekend: isWeekendNight(cursor),
      rate,
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return { nights: breakdown.length, total, breakdown, estimated: true }
}

export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0
  const start = new Date(`${checkIn}T00:00:00`)
  const end = new Date(`${checkOut}T00:00:00`)
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0
  return Math.round((end - start) / 86400000)
}
