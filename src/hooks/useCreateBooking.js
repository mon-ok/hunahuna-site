import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// Single constrained write path. The website never inserts into `guests` or
// `bookings` directly — it calls the SECURITY DEFINER `create_web_booking` RPC,
// which: upserts the guest (source = 'web'), re-checks availability, recomputes
// the authoritative total server-side, generates booking_ref, and inserts the
// booking with booking_channel = 'web', booking_timing = 'ahead',
// status = 'pending', payment_status = 'none'.
//
// Returns { booking_ref, total_amount, status } from the RPC.
async function createBooking(input) {
  const { data, error } = await supabase.rpc('create_web_booking', {
    p_full_name: input.fullName,
    p_email: input.email,
    p_phone: input.phone || null,
    p_room_id: input.roomId,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_num_guests: input.numGuests,
    p_promo_code: input.promoCode || null,
    p_notes: input.notes || null,
  })

  if (error) {
    // The RPC raises typed errors (e.g. 'ROOM_UNAVAILABLE', 'OVER_OCCUPANCY').
    // Surface the message so the form can show something useful.
    throw error
  }
  return data
}

export function useCreateBooking() {
  return useMutation({ mutationFn: createBooking })
}
