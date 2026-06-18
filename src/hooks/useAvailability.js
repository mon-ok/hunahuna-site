import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// Authoritative availability check via the Postgres RPC.
// Pending bookings DO block dates (decided with the team), so the RPC counts
// pending + confirmed + rescheduled as blocking.
async function checkAvailability({ roomId, checkIn, checkOut }) {
  const { data, error } = await supabase.rpc('check_room_availability', {
    p_room_id: roomId,
    p_check_in: checkIn,
    p_check_out: checkOut,
  })
  if (error) throw error
  // RPC returns a boolean: true = available.
  return Boolean(data)
}

export function useAvailability({ roomId, checkIn, checkOut }) {
  const enabled = Boolean(roomId && checkIn && checkOut && checkOut > checkIn)
  return useQuery({
    queryKey: ['availability', roomId, checkIn, checkOut],
    queryFn: () => checkAvailability({ roomId, checkIn, checkOut }),
    enabled,
    staleTime: 30 * 1000, // availability is time-sensitive
  })
}

// Authoritative rate quote via RPC — use this total for display before booking,
// and trust the server's value, not the client estimate.
async function quoteRate({ roomId, checkIn, checkOut }) {
  const { data, error } = await supabase.rpc('calculate_booking_rate', {
    p_room_id: roomId,
    p_check_in: checkIn,
    p_check_out: checkOut,
  })
  if (error) throw error
  return data // { nights, total_amount, avg_rate } shape — see SQL
}

export function useRateQuote({ roomId, checkIn, checkOut }) {
  const enabled = Boolean(roomId && checkIn && checkOut && checkOut > checkIn)
  return useQuery({
    queryKey: ['rate-quote', roomId, checkIn, checkOut],
    queryFn: () => quoteRate({ roomId, checkIn, checkOut }),
    enabled,
  })
}
