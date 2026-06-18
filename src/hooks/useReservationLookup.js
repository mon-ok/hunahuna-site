import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// "My Reservations" lookup. Direct table reads of bookings are blocked by RLS
// (PII protection), so this goes through a SECURITY DEFINER RPC that returns a
// single booking only when booking_ref + email match.
async function lookupReservation({ bookingRef, email }) {
  const { data, error } = await supabase.rpc('lookup_web_booking', {
    p_booking_ref: bookingRef.trim(),
    p_email: email.trim(),
  })
  if (error) throw error
  if (!data) throw new Error('No reservation found for that reference and email.')
  return data
}

export function useReservationLookup() {
  return useMutation({ mutationFn: lookupReservation })
}
