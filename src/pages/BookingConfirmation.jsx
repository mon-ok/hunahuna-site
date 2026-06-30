import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams, Navigate } from 'react-router-dom'
import { useCheckoutSession } from '@/hooks/useCheckout'
import { useReservationStatus, depositReflected } from '@/hooks/useReservationStatus'
import { loadPendingPayment } from '@/lib/pendingPayment'
import { Loader } from '@/components/States'
import { formatMoney } from '@/lib/rates'
import './BookingConfirmation.scss'

const DEPOSIT_FRACTION = 0.5 // 50% deposit (display only; the server is authoritative)
// Stop polling for the webhook after this long and show a softer "finalising" note.
const POLL_BUDGET_MS = 25000

// Map the Edge Function's error codes to guest-friendly copy.
function friendlyCheckoutError(message) {
  switch (message) {
    case 'hold_expired':
      return "This reservation's hold has expired, so it can't be paid online anymore. Please make a new booking."
    case 'not_payable':
      return 'This reservation can no longer be paid — it may already be confirmed or cancelled.'
    case 'booking_not_found':
      return "We couldn't match that reservation. Try looking it up under My Reservations."
    default:
      return message || 'Could not start the payment. Please try again.'
  }
}

// "₱X paid · ₱Y due at the resort" breakdown for a confirmed/partial booking.
function DepositCard({ booking, roomType, total }) {
  const totalAmount = booking?.total_amount ?? total ?? null
  const paid = booking?.amount_paid ?? 0
  const balance = totalAmount != null ? Math.max(totalAmount - paid, 0) : null
  const room = booking?.room_type || roomType

  return (
    <div className="confirm__card card">
      <div className="confirm__row">
        <span>Booking reference</span>
        <strong className="confirm__ref">{booking?.booking_ref}</strong>
      </div>
      {room && (
        <div className="confirm__row"><span>Room</span><span>{room}</span></div>
      )}
      {totalAmount != null && (
        <div className="confirm__row">
          <span>Total stay</span>
          <span className="price">{formatMoney(totalAmount)}</span>
        </div>
      )}
      {paid > 0 && (
        <div className="confirm__row">
          <span>Deposit paid</span>
          <span className="price">{formatMoney(paid)}</span>
        </div>
      )}
      {balance != null && (
        <div className="confirm__row">
          <span>Due at the resort</span>
          <span className="price">{formatMoney(balance)}</span>
        </div>
      )}
    </div>
  )
}

// Card prompting the guest to pay (cancelled redirect, or payment never started).
function PayPrompt({ bookingRef, email, roomType, total }) {
  const checkout = useCheckoutSession()
  const deposit = total != null ? total * DEPOSIT_FRACTION : null

  const onPay = async () => {
    try {
      const url = await checkout.mutateAsync({ bookingRef, email })
      window.location.assign(url)
    } catch {
      // checkout.error surfaced below
    }
  }

  return (
    <>
      <h1>Almost there — confirm your booking</h1>
      <p className="confirm__lead">
        Your reservation is held as <strong>pending</strong> for a short time.
        Pay the <strong>50% deposit</strong> to confirm it; the balance is settled
        at the resort on arrival.
      </p>

      <div className="confirm__card card">
        <div className="confirm__row">
          <span>Booking reference</span>
          <strong className="confirm__ref">{bookingRef}</strong>
        </div>
        {roomType && (
          <div className="confirm__row"><span>Room</span><span>{roomType}</span></div>
        )}
        {total != null && (
          <div className="confirm__row">
            <span>Total stay</span>
            <span className="price">{formatMoney(total)}</span>
          </div>
        )}
        {deposit != null && (
          <div className="confirm__row">
            <span>Deposit to pay now</span>
            <span className="price">{formatMoney(deposit)}</span>
          </div>
        )}
      </div>

      {email ? (
        <>
          {checkout.isError && (
            <p className="field__error" role="alert">
              {friendlyCheckoutError(checkout.error?.message)}
            </p>
          )}
          <div className="confirm__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={onPay}
              disabled={checkout.isPending}
            >
              {checkout.isPending ? 'Starting payment…' : 'Pay deposit now'}
            </button>
            <Link to="/reservations" className="btn btn--outline">My reservations</Link>
          </div>
        </>
      ) : (
        // No stashed email (e.g. returned on another device) — can't auto-retry.
        <>
          <p className="confirm__hint">
            To pay the deposit, look up your reservation with your booking
            reference and email.
          </p>
          <div className="confirm__actions">
            <Link to="/reservations" className="btn btn--primary">My reservations</Link>
            <Link to="/" className="btn btn--outline">Back to home</Link>
          </div>
        </>
      )}
    </>
  )
}

export default function BookingConfirmation() {
  const { state } = useLocation()
  const [params] = useSearchParams()

  const refParam = params.get('ref')
  const statusParam = params.get('status') // 'success' | 'cancel' | null
  const isReturn = Boolean(statusParam)

  // Email + display context stashed before the redirect (keyed by ref).
  const pending = isReturn ? loadPendingPayment(refParam) : null
  const email = pending?.email

  // Poll the booking status on a successful return until the webhook reflects
  // the deposit (or the budget runs out).
  const [pollExpired, setPollExpired] = useState(false)
  const status = useReservationStatus({
    bookingRef: refParam,
    email,
    enabled: isReturn && Boolean(email),
    poll: statusParam === 'success' && !pollExpired,
  })
  const booking = status.data
  const settled = depositReflected(booking)

  useEffect(() => {
    if (statusParam !== 'success' || settled) return
    const id = setTimeout(() => setPollExpired(true), POLL_BUDGET_MS)
    return () => clearTimeout(id)
  }, [statusParam, settled])

  // ---- 1. Return from PayMongo ---------------------------------------------
  if (isReturn) {
    // Cancelled / dismissed — booking still pending, offer to pay.
    if (statusParam === 'cancel') {
      return (
        <section className="section">
          <div className="container confirm">
            <PayPrompt
              bookingRef={refParam}
              email={email}
              roomType={pending?.roomType}
              total={pending?.total}
            />
          </div>
        </section>
      )
    }

    // Success path.
    return (
      <section className="section">
        <div className="container confirm">
          {!email ? (
            // Can't verify without the stashed email — point them at lookup.
            <>
              <h1>Payment received</h1>
              <p className="confirm__lead">
                Thanks! If your payment went through, your reservation{' '}
                {refParam && <strong className="confirm__ref">{refParam}</strong>} is
                being confirmed. Look it up any time with your reference and email.
              </p>
              <div className="confirm__actions">
                <Link to="/reservations" className="btn btn--primary">My reservations</Link>
                <Link to="/" className="btn btn--outline">Back to home</Link>
              </div>
            </>
          ) : settled ? (
            <>
              <h1>Deposit received — you're confirmed! 🎉</h1>
              <p className="confirm__lead">
                Thank you. Your reservation is <strong>confirmed</strong>. We've
                emailed your PayMongo receipt; the balance is due at the resort.
              </p>
              <DepositCard booking={booking} roomType={pending?.roomType} total={pending?.total} />
              <div className="confirm__actions">
                <Link to="/reservations" className="btn btn--outline">View my reservation</Link>
                <Link to="/" className="btn btn--primary">Back to home</Link>
              </div>
            </>
          ) : pollExpired ? (
            <>
              <h1>Payment received</h1>
              <p className="confirm__lead">
                Thanks! We're still finalising your confirmation — this can take a
                moment. Your deposit will appear under My Reservations shortly.
              </p>
              <DepositCard booking={booking} roomType={pending?.roomType} total={pending?.total} />
              <div className="confirm__actions">
                <Link to="/reservations" className="btn btn--primary">My reservations</Link>
                <Link to="/" className="btn btn--outline">Back to home</Link>
              </div>
            </>
          ) : (
            <>
              <h1>Finalising your payment…</h1>
              <Loader label="Confirming your deposit with the bank…" />
            </>
          )}
        </div>
      </section>
    )
  }

  // ---- 2. Arrived from the form (test mode, or payment couldn't start) ------
  const formBooking = state?.booking
  if (!formBooking) return <Navigate to="/booking" replace />

  // Real booking created but the checkout call failed — let them retry.
  if (state.needsPayment) {
    const stashed = loadPendingPayment(formBooking.booking_ref)
    return (
      <section className="section">
        <div className="container confirm">
          <PayPrompt
            bookingRef={formBooking.booking_ref}
            email={stashed?.email}
            roomType={state.roomType}
            total={formBooking.total_amount}
          />
        </div>
      </section>
    )
  }

  // Simulated (test mode) or non-payment fallback receipt.
  const ref = formBooking.booking_ref || formBooking.bookingRef
  const total = formBooking.total_amount ?? formBooking.totalAmount

  return (
    <section className="section">
      <div className="container confirm">
        {state.simulated && (
          <p className="confirm__test" role="status">
            🧪 Test mode — this is a simulated reservation. Nothing was saved.
          </p>
        )}
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
