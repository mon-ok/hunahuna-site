import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAvailability, useRateQuote } from '@/hooks/useAvailability'
import { useCreateBooking } from '@/hooks/useCreateBooking'
import { estimateStay, formatMoney, nightsBetween } from '@/lib/rates'
import './BookingForm.scss'

// Live booking writes are gated until the backend trio (RLS + RPCs) is in place.
const BOOKING_ENABLED = import.meta.env.VITE_BOOKING_ENABLED === 'true'

const today = () => new Date().toISOString().slice(0, 10)

export default function BookingForm({ rooms = [], preselectedRoomId }) {
  const navigate = useNavigate()
  const createBooking = useCreateBooking()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      roomId: preselectedRoomId || '',
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

  useEffect(() => {
    if (preselectedRoomId) setValue('roomId', preselectedRoomId)
  }, [preselectedRoomId, setValue])

  const roomId = watch('roomId')
  const checkIn = watch('checkIn')
  const checkOut = watch('checkOut')
  const numGuests = Number(watch('numGuests'))

  const room = useMemo(
    () => rooms.find((r) => String(r.id) === String(roomId)),
    [rooms, roomId]
  )

  const datesValid = Boolean(checkIn && checkOut && checkOut > checkIn)
  const availability = useAvailability({ roomId, checkIn, checkOut })
  const rateQuote = useRateQuote({ roomId, checkIn, checkOut })

  // Server total is authoritative; client estimate is a fallback for display.
  const estimate = room ? estimateStay(room, checkIn, checkOut) : null
  const nights = nightsBetween(checkIn, checkOut)
  const serverTotal = rateQuote.data?.total_amount
  const displayTotal = serverTotal ?? estimate?.total ?? null

  const overOccupancy = room && numGuests > room.max_occupancy
  const unavailable = datesValid && availability.data === false

  const onSubmit = async (values) => {
    if (!BOOKING_ENABLED) return
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
        state: { booking: result, roomType: room?.room_type },
      })
    } catch {
      // Error surfaced below via createBooking.error
    }
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {!BOOKING_ENABLED && (
        <p className="booking-form__notice" role="status">
          🛠️ Online booking is in preview. You can explore the flow, but
          submissions are disabled until the booking backend goes live.
        </p>
      )}

      <fieldset className="booking-form__group">
        <legend>Your stay</legend>

        <div className="field">
          <label className="field__label" htmlFor="roomId">Room / cottage</label>
          <select
            id="roomId"
            className="field__control"
            {...register('roomId', { required: 'Please choose a room.' })}
          >
            <option value="">Select a room…</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.room_type}, sleeps {r.max_occupancy}
              </option>
            ))}
          </select>
          {errors.roomId && <p className="field__error">{errors.roomId.message}</p>}
        </div>

        <div className="booking-form__row">
          <div className="field">
            <label className="field__label" htmlFor="checkIn">Check-in</label>
            <input
              id="checkIn"
              type="date"
              min={today()}
              className="field__control"
              {...register('checkIn', { required: 'Select a check-in date.' })}
            />
            {errors.checkIn && <p className="field__error">{errors.checkIn.message}</p>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="checkOut">Check-out</label>
            <input
              id="checkOut"
              type="date"
              min={checkIn || today()}
              className="field__control"
              {...register('checkOut', {
                required: 'Select a check-out date.',
                validate: (v) =>
                  !checkIn || v > checkIn || 'Check-out must be after check-in.',
              })}
            />
            {errors.checkOut && <p className="field__error">{errors.checkOut.message}</p>}
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="numGuests">Guests</label>
          <input
            id="numGuests"
            type="number"
            min={1}
            max={room?.max_occupancy || undefined}
            className="field__control"
            {...register('numGuests', {
              required: true,
              min: { value: 1, message: 'At least one guest.' },
              valueAsNumber: true,
            })}
          />
          {room && (
            <p className="field__hint">Max occupancy for {room.room_type}: {room.max_occupancy}</p>
          )}
          {overOccupancy && (
            <p className="field__error">Exceeds the room's maximum of {room.max_occupancy} guests.</p>
          )}
        </div>

        {/* Live availability + rate feedback */}
        {datesValid && room && (
          <div className="booking-form__status" aria-live="polite">
            {availability.isLoading && <span>Checking availability…</span>}
            {availability.isError && (
              <span className="booking-form__status--warn">
                Couldn't check availability right now.
              </span>
            )}
            {unavailable && (
              <span className="booking-form__status--bad">
                Those dates aren't available for this room.
              </span>
            )}
            {availability.data === true && (
              <span className="booking-form__status--ok">✓ Available</span>
            )}
          </div>
        )}
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
            <span>{room.room_type}</span>
            <span>{nights} night{nights > 1 ? 's' : ''}</span>
          </div>
          {displayTotal != null && (
            <div className="booking-form__summary-row booking-form__summary-total">
              <span>Estimated total</span>
              <span className="price">{formatMoney(displayTotal)}</span>
            </div>
          )}
          <p className="booking-form__summary-note">
            {serverTotal != null
              ? 'Final amount confirmed by the resort.'
              : 'Estimate only. The resort confirms the final amount.'}
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
        disabled={!BOOKING_ENABLED || isSubmitting || overOccupancy || unavailable}
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
