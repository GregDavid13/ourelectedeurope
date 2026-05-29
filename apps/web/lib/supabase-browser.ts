// Browser Supabase client. Uses @supabase/ssr's createBrowserClient so
// the session is persisted in cookies the middleware + server client
// can read (NOT localStorage) — keeping SSR auth consistent. Use this
// only in Client Components ('use client'); server code uses
// lib/supabase-server.ts (RLS via request cookies).
'use client'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@gregdavid13/db'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
