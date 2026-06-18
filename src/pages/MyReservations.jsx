import { useForm } from 'react-hook-form'
import { useReservationLookup } from '@/hooks/useReservationLookup'
import PageHeader from '@/components/PageHeader'
import { formatMoney } from '@/lib/rates'
import './MyReservations.scss'

const STATUS_LABEL = {
  pending: 'Pending confirmation',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  rescheduled: 'Rescheduled',
}

export default function MyReservations() {
  const lookup = useReservationLookup()
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { bookingRef: '', email: '' },
  })

  const onSubmit = (v) => lookup.mutate(v)
  const booking = lookup.data

  return (
    <>
      <PageHeader eyebrow="Your trip" title="My Reservations">
        Look up a reservation with your booking reference and the email you used.
      </PageHeader>

      <section className="section">
        <div className="container reservations">
          <form className="reservations__form card" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="field">
              <label className="field__label" htmlFor="r-ref">Booking reference</label>
              <input id="r-ref" className="field__control" placeholder="e.g. HH-2026-0042"
                {...register('bookingRef', { required: 'Enter your booking reference.' })} />
              {errors.bookingRef && <p className="field__error">{errors.bookingRef.message}</p>}
            </div>
            <div className="field">
              <label className="field__label" htmlFor="r-email">Email</label>
              <input id="r-email" type="email" className="field__control"
                {...register('email', { required: 'Enter your email.' })} />
              {errors.email && <p className="field__error">{errors.email.message}</p>}
            </div>
            <button type="submit" className="btn btn--primary btn--block" disabled={lookup.isPending}>
              {lookup.isPending ? 'Looking up…' : 'Find my reservation'}
            </button>
            {lookup.isError && (
              <p className="field__error" role="alert">
                {lookup.error?.message || 'No reservation found.'}
              </p>
            )}
          </form>

          {booking && (
            <div className="reservations__result card" aria-live="polite">
              <div className="reservations__status">
                <span className={`badge res-status res-status--${booking.status}`}>
                  {STATUS_LABEL[booking.status] ?? booking.status}
                </span>
              </div>
              <h2 className="reservations__ref">{booking.booking_ref}</h2>
              <dl className="reservations__details">
                {booking.room_type && (<><dt>Room</dt><dd>{booking.room_type}</dd></>)}
                <dt>Check-in</dt><dd>{booking.check_in}</dd>
                <dt>Check-out</dt><dd>{booking.check_out}</dd>
                <dt>Guests</dt><dd>{booking.num_guests}</dd>
                {booking.total_amount != null && (
                  <><dt>Total</dt><dd className="price">{formatMoney(booking.total_amount)}</dd></>
                )}
                {booking.payment_status && (
                  <><dt>Payment</dt><dd className="reservations__pay">{booking.payment_status}</dd></>
                )}
              </dl>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
