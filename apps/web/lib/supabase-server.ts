// Anon key + request cookies → RLS enforced at Postgres. Use this for
// all user-context reads/writes. The user can only see their own data.
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@gregdavid13/db'

type CookieToSet = { name: string; value: string; options: CookieOptions }

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet: CookieToSet[]) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options }))
          } catch {
            // Called from a Server Component — safe to ignore; the
            // middleware refreshes the session cookie.
          }
        },
      },
    }
  )
}
