import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// Active rooms, each with its primary image for the card thumbnail.
async function fetchRooms() {
  const { data, error } = await supabase
    .from('rooms')
    .select(
      `id, room_number, room_type, base_rate, weekday_rate, weekend_rate,
       holiday_rate, max_occupancy, has_aircon, description, is_active,
       room_images ( id, storage_path, alt_text, sort_order, is_primary )`
    )
    .eq('is_active', true)
    // Sort by type, then by room_number as a stable tiebreaker — without a
    // unique secondary key Postgres returns same-type rows in arbitrary order,
    // which made the list reshuffle between page loads.
    .order('room_type', { ascending: true })
    .order('room_number', { ascending: true })
    .order('sort_order', { ascending: true, foreignTable: 'room_images' })

  if (error) throw error
  return data ?? []
}

export function useRooms() {
  return useQuery({ queryKey: ['rooms'], queryFn: fetchRooms })
}
