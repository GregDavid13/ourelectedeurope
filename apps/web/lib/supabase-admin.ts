// Service-role client — BYPASSES RLS. Server-only. Use exclusively
// for system operations (webhooks, cron, audit writes). Never import
// from client/RN code. CODEOWNERS-guarded.
import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@gregdavid13/db'

export function createAdminClient() {
  // SUPABASE_SERVICE_ROLE_KEY is optional at boot (lib/env.ts) — guard
  // here so a missing key surfaces as a clear error at the point of
  // use instead of a cryptic supabase-js failure deeper in a request.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'createAdminClient requires NEXT_PUBLIC_SUPABASE_URL and ' +
      'SUPABASE_SERVICE_ROLE_KEY to be set'
    )
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
