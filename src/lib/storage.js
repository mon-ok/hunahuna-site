import { supabase } from './supabaseClient'

// Bucket names are configurable per environment; confirm with the team.
export const BUCKETS = {
  rooms: import.meta.env.VITE_BUCKET_ROOMS || 'room-photos',
  menu: import.meta.env.VITE_BUCKET_MENU || 'menu-photos',
  gallery: import.meta.env.VITE_BUCKET_GALLERY || 'gallery',
}

/**
 * Resolve a stored `storage_path` to a public URL.
 *
 * Tables store only the path (e.g. "deluxe/front.jpg"), not the file or full URL.
 * If a value already looks like an absolute URL we pass it through unchanged,
 * which keeps the helper safe if a row ever holds a full link.
 *
 * @param {string|null|undefined} path  storage_path / image_path from a row
 * @param {keyof typeof BUCKETS} bucketKey  which bucket the path lives in
 * @returns {string|null} public URL, or null when there is no path
 */
export function publicUrl(path, bucketKey = 'gallery') {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path

  const bucket = BUCKETS[bucketKey] || bucketKey
  const clean = path.replace(/^\/+/, '')
  const { data } = supabase.storage.from(bucket).getPublicUrl(clean)
  return data?.publicUrl ?? null
}

export const roomImageUrl = (path) => publicUrl(path, 'rooms')
export const menuImageUrl = (path) => publicUrl(path, 'menu')
export const galleryImageUrl = (path) => publicUrl(path, 'gallery')
