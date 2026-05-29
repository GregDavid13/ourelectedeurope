// createClient factory shared by web (browser + server) and React
// Native. Migrations are NOT here — they are canonical at
// /supabase/migrations (#7). This package is client + generated types
// only.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export function createClient(url: string, anonKey: string) {
  return createSupabaseClient<Database>(url, anonKey)
}

export type { Database }
