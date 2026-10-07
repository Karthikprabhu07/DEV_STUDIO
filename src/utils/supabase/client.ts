import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  'https://yzzrrxprhteeuwktzocz.supabase.co'

const supabaseKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  'sb_publishable_6cIR0Xl1Qc0RmZOP5z0WjA_vcS3hpVO'

export const createClient = () => createSupabaseClient(supabaseUrl, supabaseKey)
