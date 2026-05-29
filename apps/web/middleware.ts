import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

type CookieToSet = { name: string; value: string; options: CookieOptions }

const PROTECTED_ROUTES = ['/dashboard', '/settings', '/onboarding']
const AUTH_ROUTES      = ['/login', '/register']

// Build the CSP for this request. nonce + strict-dynamic instead of
// 'unsafe-inline'; the https://js.stripe.com entry is a pre-CSP3
// fallback only. style-src keeps 'unsafe-inline' (Next injects inline
// <style>; style << script risk — accepted trade-off).
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com`,
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
}

// One source of truth for headers. Applied to EVERY returned response
// including redirects (the original framework set them only on the
// pass-through, so /login and /dashboard redirects shipped bare).
function applySecurityHeaders(res: NextResponse, csp: string): NextResponse {
  res.headers.set('X-Content-Type-Options',   'nosniff')
  res.headers.set('X-Frame-Options',          'DENY')
  res.headers.set('Referrer-Policy',          'strict-origin-when-cross-origin')
  res.headers.set('Strict-Transport-Security','max-age=31536000; includeSubDomains; preload')
  res.headers.set('Permissions-Policy',       'camera=(), microphone=(), geolocation=()')
  res.headers.set('Content-Security-Policy', csp)
  return res
}

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  // CRITICAL: Next.js reads the nonce from the Content-Security-Policy
  // *request* header and stamps it onto every <script> it injects.
  // Without this header on the request, Next's bootstrap/hydration
  // scripts ship with no nonce, strict-dynamic blocks them, and the app
  // never hydrates (forms/buttons silently dead). Setting it on the
  // response alone (as the original scaffold did) is not enough.
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

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
      NextResponse.redirect(new URL('/login', request.url)), csp)
  }
  if (AUTH_ROUTES.some(r => path.startsWith(r)) && user) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL('/dashboard', request.url)), csp)
  }

  return applySecurityHeaders(response, csp)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
