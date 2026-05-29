// Supabase OAuth + magic link handler. Exchanges code for session,
// sets httpOnly cookie, redirects to /onboarding or /dashboard. STUB.
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
export async function GET(req: NextRequest) {
  // TODO: supabase.auth.exchangeCodeForSession(code)
  return NextResponse.redirect(new URL('/dashboard', req.url))
}
