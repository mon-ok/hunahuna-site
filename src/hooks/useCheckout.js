import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// Starts (or retries) a PayMongo deposit checkout for an existing pending
// booking. Calls the `create-checkout-session` Edge Function, which:
//   * re-validates the booking server-side (status pending, hold still live,
//     email matches),
//   * computes the 50% deposit from bookings.total_amount (the client never
//     sends an amount),
//   * creates the PayMongo session + a pending booking_payments row,
//   * returns { checkout_url }.
// The caller then does window.location = checkout_url.
async function createCheckoutSession({ bookingRef, email }) {
  const { data, error } = await supabase.functions.invoke(
    'create-checkout-session',
    { body: { booking_ref: bookingRef, email } },
  )

  if (error) {
    // FunctionsHttpError carries the non-2xx Response on `context`; surface the
    // function's own { error } code/message when we can read it.
    let detail
    try {
      detail = await error.context?.json?.()
    } catch {
      // body wasn't JSON / already consumed
    }
    throw new Error(
      detail?.error || error.message || 'Could not start the payment. Please try again.',
    )
  }
  if (!data?.checkout_url) {
    throw new Error('Payment could not be started (no checkout URL).')
  }
  return data.checkout_url
}

export function useCheckoutSession() {
  return useMutation({ mutationFn: createCheckoutSession })
}
