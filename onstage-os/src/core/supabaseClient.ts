import { createClient } from '@supabase/supabase-js'

// Public anon/publishable key — safe to expose client-side.
// Every table is protected by row-level security; access is governed
// there, not by hiding this key.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://kxwnrbajrrazhqklyseq.supabase.co'
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_0lj4MXTTnqt-K4MD6CUIAg_BtiUQ8Jj'

export const supabase = createClient(supabaseUrl, supabaseKey)
