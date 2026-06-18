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
    .order('room_type', { ascending: true })

  if (error) throw error
  return data ?? []
}

export function useRooms() {
  return useQuery({ queryKey: ['rooms'], queryFn: fetchRooms })
}
