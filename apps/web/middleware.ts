import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

type CookieToSet = { name: string; value: string; options: CookieOptions }

const PROTECTED_ROUTES = ['/dashboard', '/legislation', '/account', '/settings', '/onboarding']
const AUTH_ROUTES      = ['/login', '/register']

// CSP. NOTE on script-src: the scaffold originally used a per-request
// `nonce` + 'strict-dynamic'. That only works when EVERY page is
// dynamically rendered — Next.js cannot stamp a per-request nonce onto
// statically-prerendered HTML, so on a static page strict-dynamic
// blocks Next's own bootstrap scripts and the app never hydrates
// (forms/buttons silently dead → e.g. login does a no-op native
// submit). Since the marketing + auth pages are static, we use
// 'self' 'unsafe-inline' for scripts: compatible with static rendering
// and the standard Next.js production CSP. Trade-off: 'unsafe-inline'
// is weaker than nonce. To restore the stricter nonce/strict-dynamic
// policy, force dynamic rendering on every route and reinstate the
// nonce (see git history for the nonce plumbing).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

// One source of truth for headers. Applied to EVERY returned response
// including redirects (the original framework set them only on the
// pass-through, so /login and /dashboard redirects shipped bare).
function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Content-Type-Options',   'nosniff')
  res.headers.set('X-Frame-Options',          'DENY')
  res.headers.set('Referrer-Policy',          'strict-origin-when-cross-origin')
  res.headers.set('Strict-Transport-Security','max-age=31536000; includeSubDomains; preload')
  res.headers.set('Permissions-Policy',       'camera=(), microphone=(), geolocation=()')
  res.headers.set('Content-Security-Policy', CSP)
  return res
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet: CookieToSet[]) =>
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set({ name, value, ...options })),
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Redirects get headers too. NOTE residual (see Master Framework):
  // a fresh redirect response drops a session cookie refreshed above
  // — copy response.cookies onto the redirect if you rely on refresh
  // here. Documented, not yet fixed.
  if (PROTECTED_ROUTES.some(r => path.startsWith(r)) && !user) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL('/login', request.url)))
  }
  if (AUTH_ROUTES.some(r => path.startsWith(r)) && user) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL('/dashboard', request.url)))
  }

  return applySecurityHeaders(response)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
