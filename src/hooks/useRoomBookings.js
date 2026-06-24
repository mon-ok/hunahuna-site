import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { BLOCKING_STATUSES, todayYmd } from '@/lib/availability'

// Future blocking bookings, used to paint the booking calendar. We only need
// the date span, the room, and the status — never any guest data. RLS keeps
// this read anonymous-safe; the authoritative conflict check still runs in the
// booking RPC at submit time.
async function fetchRoomBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('room_id, check_in, check_out, status')
    .in('status', [...BLOCKING_STATUSES])
    .gte('check_out', todayYmd())

  if (error) throw error
  return data ?? []
}

export function useRoomBookings() {
  return useQuery({
    queryKey: ['room-bookings'],
    queryFn: fetchRoomBookings,
    staleTime: 60 * 1000, // availability is time-sensitive
  })
}
