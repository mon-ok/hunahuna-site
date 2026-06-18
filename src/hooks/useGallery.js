import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

async function fetchGallery() {
  const { data, error } = await supabase
    .from('gallery_images')
    .select(`id, storage_path, caption, category, sort_order, is_active`)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export function useGallery() {
  return useQuery({ queryKey: ['gallery'], queryFn: fetchGallery })
}
