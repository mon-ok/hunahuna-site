// Bridges the PayMongo redirect round-trip.
//
// We send the guest off-site to PayMongo and they come back to
// /booking/confirmed?ref=<booking_ref>&status=success|cancel. That return URL
// carries ONLY the booking_ref — but `lookup_web_booking` needs the ref AND the
// email (it never trusts a ref alone). So just before redirecting we stash the
// email (plus a little display context) here, keyed by ref, and read it back on
// return. sessionStorage (not local) so it's scoped to the tab and clears itself.
//
// If it's missing on return (different device, cleared storage), the page falls
// back to pointing the guest at /reservations to look up with ref + email.

const KEY = 'hh_pending_payment'

export function savePendingPayment(payment) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payment))
  } catch {
    // Private mode / storage disabled — the return page degrades gracefully.
  }
}

export function loadPendingPayment(ref) {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const payment = JSON.parse(raw)
    // Only return it if it matches the ref we came back with.
    if (ref && payment?.ref && payment.ref !== ref) return null
    return payment
  } catch {
    return null
  }
}

export function clearPendingPayment() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
