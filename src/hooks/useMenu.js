import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// Available menu items only. Grouping by outlet/category happens in the page.
async function fetchMenu() {
  const { data, error } = await supabase
    .from('menu_items')
    .select(
      `id, category, name, description, price, is_market_price,
       is_available, outlet, image_path`
    )
    .eq('is_available', true)
    .order('outlet', { ascending: true })
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export function useMenu() {
  return useQuery({ queryKey: ['menu'], queryFn: fetchMenu })
}
