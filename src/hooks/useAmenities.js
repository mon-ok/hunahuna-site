import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

async function fetchAmenities() {
  const { data, error } = await supabase
    .from('amenities')
    .select(`id, name, type, description, hours, price, capacity, is_active`)
    .eq('is_active', true)
    .order('type', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export function useAmenities() {
  return useQuery({ queryKey: ['amenities'], queryFn: fetchAmenities })
}
