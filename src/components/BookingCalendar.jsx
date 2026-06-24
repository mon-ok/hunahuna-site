import { useMemo, useState } from 'react'
import { ymd, parseYmd, addDays } from '@/lib/availability'
import './BookingCalendar.scss'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const monthStart = (d) => new Date(d.getFullYear(), d.getMonth(), 1)

/**
 * Date-range calendar for the booking form.
 *
 * - Dates before `minDate` (today + lead time) are disabled.
 * - When `showAvailability` is on, each night is painted green (a room of the
 *   selected type is free) or red (the whole type is booked). Red nights can't
 *   start or sit inside a stay, but you may still check out on one (turnover).
 */
export default function BookingCalendar({
  checkIn,
  checkOut,
  onChange,
  minDate,
  showAvailability = false,
  isNightAvailable,
}) {
  const initial = checkIn || minDate || ymd(new Date())
  const [view, setView] = useState(() => monthStart(parseYmd(initial)))

  const minMonth = useMemo(
    () => (minDate ? monthStart(parseYmd(minDate)) : null),
    [minDate]
  )
  const canGoPrev = !minMonth || view > minMonth

  const cells = useMemo(() => {
    const year = view.getFullYear()
    const month = view.getMonth()
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const out = []
    for (let i = 0; i < firstWeekday; i++) out.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      out.push(ymd(new Date(year, month, day)))
    }
    return out
  }, [view])

  const available = (dStr) =>
    !showAvailability || (isNightAvailable ? isNightAvailable(dStr) : true)

  const nightsAllAvailable = (inStr, outStr) => {
    let cur = parseYmd(inStr)
    const end = parseYmd(outStr)
    while (cur < end) {
      if (!available(ymd(cur))) return false
      cur = addDays(cur, 1)
    }
    return true
  }

  const handleClick = (dStr) => {
    const isPast = minDate && dStr < minDate
    if (isPast) return
    const startable = available(dStr)

    // Start a fresh selection.
    if (!checkIn || (checkIn && checkOut)) {
      if (startable) onChange({ checkIn: dStr, checkOut: '' })
      return
    }
    // Re-pick the start when clicking on/before it.
    if (dStr <= checkIn) {
      if (startable) onChange({ checkIn: dStr, checkOut: '' })
      return
    }
    // Set the check-out — every night in between must be available.
    if (nightsAllAvailable(checkIn, dStr)) {
      onChange({ checkIn, checkOut: dStr })
    } else if (startable) {
      onChange({ checkIn: dStr, checkOut: '' })
    }
  }

  return (
    <div className="bk-cal">
      <div className="bk-cal__header">
        <button
          type="button"
          className="bk-cal__nav"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          disabled={!canGoPrev}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="bk-cal__month" aria-live="polite">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </span>
        <button
          type="button"
          className="bk-cal__nav"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="bk-cal__weekdays" aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="bk-cal__grid">
        {cells.map((dStr, i) => {
          if (!dStr) return <span key={`b${i}`} className="bk-cal__cell is-blank" />

          const isPast = minDate && dStr < minDate
          const isAvail = available(dStr)
          const booked = showAvailability && !isAvail
          const isCheckIn = dStr === checkIn
          const isCheckOut = dStr === checkOut
          const inRange = checkIn && checkOut && dStr > checkIn && dStr < checkOut
          const day = Number(dStr.slice(8))

          const cls = [
            'bk-cal__cell',
            isPast && 'is-disabled',
            !isPast && booked && 'is-booked',
            !isPast && showAvailability && isAvail && 'is-available',
            (isCheckIn || isCheckOut) && 'is-endpoint',
            inRange && 'is-inrange',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              type="button"
              key={dStr}
              className={cls}
              onClick={() => handleClick(dStr)}
              disabled={isPast}
              aria-pressed={isCheckIn || isCheckOut || inRange}
              aria-label={
                booked ? `${dStr} — fully booked` : dStr
              }
            >
              {day}
            </button>
          )
        })}
      </div>

      {showAvailability && (
        <div className="bk-cal__legend">
          <span><i className="dot dot--avail" /> Available</span>
          <span><i className="dot dot--booked" /> Fully booked</span>
        </div>
      )}
    </div>
  )
}
