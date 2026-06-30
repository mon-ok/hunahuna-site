import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// Read-only status poll for the PayMongo return page. Same RPC as the manual
// "My Reservations" lookup, but as a query so we can poll: the webhook that
// flips the booking to confirmed/partial may land a second or two after the
// browser is redirected back, so on a successful return we re-check until the
// deposit is reflected (or the caller stops polling).
//
// `lookup_web_booking` needs ref AND email; the email comes from the stashed
// pending-payment record (see lib/pendingPayment.js), never the URL.

export function depositReflected(booking) {
  if (!booking) return false
  return (
    booking.payment_status === 'partial' ||
    booking.payment_status === 'paid' ||
    booking.status === 'confirmed'
  )
}

export function useReservationStatus({ bookingRef, email, enabled = true, poll = false }) {
  return useQuery({
    queryKey: ['reservation-status', bookingRef, email],
    enabled: Boolean(enabled && bookingRef && email),
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('lookup_web_booking', {
        p_booking_ref: bookingRef.trim(),
        p_email: email.trim(),
      })
      if (error) throw error
      return data ?? null // jsonb object, or null when ref+email don't match
    },
    // v5: callback receives the query; return false to stop polling. We poll
    // only while asked to AND the deposit hasn't shown up yet.
    refetchInterval: poll
      ? (query) => (depositReflected(query.state.data) ? false : 2500)
      : false,
  })
}
