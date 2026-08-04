import { supabase } from '../supabaseClient'

// Same 'post-media' bucket the customer-facing app uploads to — shared
// Supabase project, shared storage. Keeping the exact same path convention
// (userId/timestamp.ext) so this plugs into existing bucket RLS unchanged.
export async function uploadMedia(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from('post-media')
    .upload(path, file, { upsert: false, contentType: file.type })

  if (error) throw error

  const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(data.path)
  return urlData.publicUrl
}

// Mirrors the customer app's aspect-ratio buckets so organiser posts render
// with the same portrait/landscape/square treatment fans already see.
export function detectAspectRatio(width: number, height: number): string {
  const ratio = width / height
  if (ratio > 1.6) return '16:9'
  if (ratio < 0.7) return '9:16'
  if (ratio < 0.85) return '4:5'
  return '1:1'
}