import { Link, useLocation, Navigate } from 'react-router-dom'
import { formatMoney } from '@/lib/rates'
import './BookingConfirmation.scss'

export default function BookingConfirmation() {
  const { state } = useLocation()
  const booking = state?.booking

  // Direct hits with no state have nothing to show — send them to booking.
  if (!booking) return <Navigate to="/booking" replace />

  const ref = booking.booking_ref || booking.bookingRef
  const total = booking.total_amount ?? booking.totalAmount

  return (
    <section className="section">
      <div className="container confirm">
        <div className="confirm__icon" aria-hidden="true">🎉</div>
        <h1>Reservation requested!</h1>
        <p className="confirm__lead">
          Thanks for booking with Hunahuna. Your reservation is <strong>pending</strong>,
          and the resort will confirm availability and payment shortly.
        </p>

        <div className="confirm__card card">
          <div className="confirm__row">
            <span>Booking reference</span>
            <strong className="confirm__ref">{ref}</strong>
          </div>
          {state.roomType && (
            <div className="confirm__row"><span>Room</span><span>{state.roomType}</span></div>
          )}
          {total != null && (
            <div className="confirm__row">
              <span>Estimated total</span>
              <span className="price">{formatMoney(total)}</span>
            </div>
          )}
        </div>

        <p className="confirm__hint">
          Keep your reference handy. You can look up your reservation any time with
          your booking reference and email.
        </p>

        <div className="confirm__actions">
          <Link to="/reservations" className="btn btn--outline">View my reservation</Link>
          <Link to="/" className="btn btn--primary">Back to home</Link>
        </div>
      </div>
    </section>
  )
}
