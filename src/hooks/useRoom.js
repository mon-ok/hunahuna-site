import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// Single room plus its full image gallery (ordered for the detail page).
async function fetchRoom(id) {
  const { data, error } = await supabase
    .from('rooms')
    .select(
      `id, room_number, room_type, base_rate, weekday_rate, weekend_rate,
       holiday_rate, max_occupancy, has_aircon, description, is_active,
       room_images ( id, storage_path, alt_text, sort_order, is_primary )`
    )
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) throw error
  if (data?.room_images) {
    data.room_images.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }
  return data
}

export function useRoom(id) {
  return useQuery({
    queryKey: ['room', id],
    queryFn: () => fetchRoom(id),
    enabled: Boolean(id),
  })
}
