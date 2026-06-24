import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useCreateBooking } from '@/hooks/useCreateBooking'
import { useRoomBookings } from '@/hooks/useRoomBookings'
import RoomTypePicker from '@/components/RoomTypePicker'
import BookingCalendar from '@/components/BookingCalendar'
import {
  addDays,
  ymd,
  parseYmd,
  anyRoomFreeOnNight,
  firstFreeRoom,
} from '@/lib/availability'
import { estimateStay, formatMoney, nightsBetween } from '@/lib/rates'
import './BookingForm.scss'

// Live booking writes are gated until the backend trio (RLS + RPCs) is in place.
const BOOKING_ENABLED = import.meta.env.VITE_BOOKING_ENABLED === 'true'

// Test mode lets the full flow run end-to-end without a real DB write — the
// booking RPC isn't deployed and direct inserts are blocked by RLS. A simulated
// reservation is created so the confirmation page (a future digital receipt /
// PayMongo step) can be exercised. Ignored when real writes are enabled.
const TEST_MODE = import.meta.env.VITE_BOOKING_TEST_MODE === 'true'
const CAN_SUBMIT = BOOKING_ENABLED || TEST_MODE

// Short, human-readable reference for a simulated booking.
function makeTestRef() {
  return `TEST-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

// Bookings can only be made at least this many days ahead of today.
const LEAD_DAYS = 2

// Collapse identical rooms into one entry per type, carrying the concrete rooms
// so we can attach an available one to the reservation.
function groupByType(rooms) {
  const map = new Map()
  for (const room of rooms) {
    let g = map.get(room.room_type)
    if (!g) {
      g = { type: room.room_type, count: 0, representative: room, rooms: [] }
      map.set(room.room_type, g)
    }
    g.count += 1
    g.rooms.push(room)
  }
  return [...map.values()]
}

function formatNice(dStr) {
  if (!dStr) return '—'
  return parseYmd(dStr).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

export default function BookingForm({ rooms = [], preselectedRoomId }) {
  const navigate = useNavigate()
  const createBooking = useCreateBooking()
  const { data: bookings = [] } = useRoomBookings()

  const groups = useMemo(() => groupByType(rooms), [rooms])
  const minDate = useMemo(() => ymd(addDays(new Date(), LEAD_DAYS)), [])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      roomType: '',
      roomId: '',
      checkIn: '',
      checkOut: '',
      numGuests: 1,
      fullName: '',
      email: '',
      phone: '',
      promoCode: '',
      notes: '',
    },
  })

  // Register the fields the picker/calendar drive via setValue.
  useEffect(() => {
    register('roomType', { required: 'Please choose a room.' })
    register('roomId', { required: true })
    register('checkIn', { required: 'Select your dates.' })
    register('checkOut', { required: 'Select your dates.' })
  }, [register])

  const roomType = watch('roomType')
  const roomId = watch('roomId')
  const checkIn = watch('checkIn')
  const checkOut = watch('checkOut')
  const numGuests = Number(watch('numGuests'))

  const group = useMemo(
    () => groups.find((g) => g.type === roomType),
    [groups, roomType]
  )
  const room = group?.representative

  // Preselect the type from a ?room=<id> link (e.g. arriving from a room page).
  useEffect(() => {
    if (!preselectedRoomId || roomType) return
    const match = rooms.find((r) => String(r.id) === String(preselectedRoomId))
    if (match) setValue('roomType', match.room_type, { shouldValidate: true })
  }, [preselectedRoomId, rooms, roomType, setValue])

  const datesValid = Boolean(checkIn && checkOut && checkOut > checkIn)

  // Attach a concrete, conflict-free room of the chosen type for the range.
  useEffect(() => {
    if (!group || !datesValid) {
      if (roomId) setValue('roomId', '')
      return
    }
    const resolved = firstFreeRoom(group.rooms, bookings, checkIn, checkOut) || ''
    setValue('roomId', resolved, { shouldValidate: true })
  }, [group, datesValid, checkIn, checkOut, bookings, roomId, setValue])

  const isNightAvailable = useMemo(() => {
    if (!group) return undefined
    return (dStr) => anyRoomFreeOnNight(group.rooms, bookings, dStr)
  }, [group, bookings])

  const estimate = room ? estimateStay(room, checkIn, checkOut) : null
  const nights = nightsBetween(checkIn, checkOut)
  const displayTotal = estimate?.total ?? null

  const occupancyMax = room?.max_occupancy
  const guestsOver = occupancyMax && numGuests > occupancyMax
  const unavailable = datesValid && group && !roomId

  const onChangeDates = ({ checkIn: ci, checkOut: co }) => {
    setValue('checkIn', ci, { shouldValidate: true })
    setValue('checkOut', co, { shouldValidate: true })
  }

  const onSelectType = (type) => {
    setValue('roomType', type, { shouldValidate: true })
    // A different type may not have the same rooms free for the current range;
    // roomId re-resolves via the effect above.
  }

  const onSubmit = async (values) => {
    if (!CAN_SUBMIT) return

    // Simulated submission — no persistence until the backend goes live.
    if (TEST_MODE && !BOOKING_ENABLED) {
      await new Promise((r) => setTimeout(r, 500)) // mimic a network round-trip
      navigate('/booking/confirmed', {
        state: {
          booking: {
            booking_ref: makeTestRef(),
            total_amount: displayTotal,
            status: 'pending',
          },
          roomType: group?.type,
          simulated: true,
        },
      })
      return
    }

    try {
      const result = await createBooking.mutateAsync({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        roomId: values.roomId,
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        numGuests: Number(values.numGuests),
        promoCode: values.promoCode,
        notes: values.notes,
      })
      navigate('/booking/confirmed', {
        state: { booking: result, roomType: group?.type },
      })
    } catch {
      // Error surfaced below via createBooking.error
    }
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {!BOOKING_ENABLED && TEST_MODE && (
        <p className="booking-form__notice" role="status">
          🧪 Test mode: you can submit and walk the full flow, but the
          reservation is <strong>simulated only</strong> — nothing is saved to
          the database yet.
        </p>
      )}
      {!BOOKING_ENABLED && !TEST_MODE && (
        <p className="booking-form__notice" role="status">
          🛠️ Online booking is in preview. You can explore the flow, but
          submissions are disabled until the booking backend goes live.
        </p>
      )}

      <fieldset className="booking-form__group">
        <legend>Choose your room</legend>
        <RoomTypePicker groups={groups} value={roomType} onSelect={onSelectType} />
        {errors.roomType && <p className="field__error">{errors.roomType.message}</p>}
      </fieldset>

      <fieldset className="booking-form__group">
        <legend>Choose your dates</legend>

        <div className="booking-dates">
          <BookingCalendar
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={onChangeDates}
            minDate={minDate}
            showAvailability={Boolean(group)}
            isNightAvailable={isNightAvailable}
          />

          <div className="booking-dates__info">
            {!group && (
              <p className="booking-dates__hint">
                Pick a room above to see which dates are open.
              </p>
            )}
            <div className="booking-dates__chips">
              <div className="booking-dates__chip">
                <span className="booking-dates__chip-label">Check-in</span>
                <span className="booking-dates__chip-value">{formatNice(checkIn)}</span>
              </div>
              <div className="booking-dates__chip">
                <span className="booking-dates__chip-label">Check-out</span>
                <span className="booking-dates__chip-value">{formatNice(checkOut)}</span>
              </div>
            </div>
            <p className="booking-dates__lead">
              Bookings open from <strong>{formatNice(minDate)}</strong> ({LEAD_DAYS} days
              ahead).
            </p>
            {errors.checkIn && <p className="field__error">{errors.checkIn.message}</p>}
            {unavailable && (
              <p className="booking-form__status booking-form__status--bad">
                No {group.type} is free for the whole of those dates. Try different
                dates or another room.
              </p>
            )}
            {datesValid && roomId && (
              <p className="booking-form__status booking-form__status--ok">
                ✓ Available for your dates
              </p>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className="booking-form__group">
        <legend>Guests</legend>
        <div className="field">
          <label className="field__label" htmlFor="numGuests">Number of guests</label>
          <input
            id="numGuests"
            type="number"
            min={1}
            max={occupancyMax || undefined}
            className="field__control"
            {...register('numGuests', {
              required: true,
              min: { value: 1, message: 'At least one guest.' },
              valueAsNumber: true,
            })}
          />
          {room && (
            <p className="field__hint">Max occupancy for {group.type}: {occupancyMax}</p>
          )}
          {guestsOver && (
            <p className="field__error">Exceeds the room's maximum of {occupancyMax} guests.</p>
          )}
        </div>
      </fieldset>

      <fieldset className="booking-form__group">
        <legend>Your details</legend>

        <div className="field">
          <label className="field__label" htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            className="field__control"
            {...register('fullName', { required: 'Please enter your name.' })}
          />
          {errors.fullName && <p className="field__error">{errors.fullName.message}</p>}
        </div>

        <div className="booking-form__row">
          <div className="field">
            <label className="field__label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="field__control"
              {...register('email', {
                required: 'Please enter your email.',
                pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Enter a valid email.' },
              })}
            />
            {errors.email && <p className="field__error">{errors.email.message}</p>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="phone">Phone <span className="field__opt">(optional)</span></label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              className="field__control"
              {...register('phone')}
            />
          </div>
        </div>

        <div className="booking-form__row">
          <div className="field">
            <label className="field__label" htmlFor="promoCode">Promo code <span className="field__opt">(optional)</span></label>
            <input id="promoCode" type="text" className="field__control" {...register('promoCode')} />
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="notes">Special requests <span className="field__opt">(optional)</span></label>
          <textarea id="notes" rows={3} className="field__control" {...register('notes')} />
        </div>
      </fieldset>

      {/* Summary */}
      {room && datesValid && nights > 0 && (
        <div className="booking-form__summary">
          <div className="booking-form__summary-row">
            <span>{group.type}</span>
            <span>{nights} night{nights > 1 ? 's' : ''}</span>
          </div>
          {displayTotal != null && (
            <div className="booking-form__summary-row booking-form__summary-total">
              <span>Estimated total</span>
              <span className="price">{formatMoney(displayTotal)}</span>
            </div>
          )}
          <p className="booking-form__summary-note">
            Estimate only. The resort confirms the final amount.
          </p>
        </div>
      )}

      {createBooking.isError && (
        <p className="field__error" role="alert">
          {createBooking.error?.message || 'Booking failed. Please try again.'}
        </p>
      )}

      <button
        type="submit"
        className="btn btn--primary btn--block booking-form__submit"
        disabled={!CAN_SUBMIT || isSubmitting || guestsOver || unavailable || !roomId}
      >
        {isSubmitting ? 'Submitting…' : 'Request reservation'}
      </button>

      <p className="booking-form__fineprint">
        Reservations are created as <strong>pending</strong>. The resort confirms
        availability and payment before your stay.
      </p>
    </form>
  )
}
