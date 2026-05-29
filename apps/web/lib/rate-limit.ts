import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'
import { ipAddress } from '@vercel/functions'

// Upstash Redis IS the rate-limit enforcement mechanism: atomic,
// serverless, edge. The rate_limit_log table is NOT a second limiter
// — it's a forensic sink written only on the 429 path.
//
// Resilience posture (chosen 2026-05-23 — see SCAFFOLD-NOTES): rate
// limiting FAILS OPEN. The client is built lazily (importing this
// module never throws — the old top-level `Redis.fromEnv()` 500'd
// every route that imported it whenever Upstash was unset, including
// the common SKIP_ENV_VALIDATION local-dev path). If Upstash is not
// configured, or a `.limit()` call throws (transient outage), the
// request is ALLOWED and the event is logged — a Redis blip must never
// take down the whole API. Trade-off: brief windows where limits
// aren't enforced. To run fail-CLOSED instead, replace the two
// `return null` fallbacks below with a 503 response.

type LimiterKind = 'api' | 'auth'

// Lazy singletons. `redis === undefined` means "not yet resolved";
// `null` means "resolved: not configured".
let redis: Redis | null | undefined
const limiters: Partial<Record<LimiterKind, Ratelimit>> = {}
let warnedUnconfigured = false

function getRedis(): Redis | null {
  if (redis !== undefined) return redis
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  redis = url && token ? new Redis({ url, token }) : null
  return redis
}

function getLimiter(kind: LimiterKind): Ratelimit | null {
  const existing = limiters[kind]
  if (existing) return existing
  const r = getRedis()
  if (!r) return null
  // api: 20 req / 10s (per-user budget). auth: 5 req / 60s (brute force).
  const limiter = kind === 'auth'
    ? Ratelimit.slidingWindow(5, '60 s')
    : Ratelimit.slidingWindow(20, '10 s')
  const created = new Ratelimit({ redis: r, limiter, analytics: true })
  limiters[kind] = created
  return created
}

// Never trust client-supplied x-forwarded-for. Next.js 15 removed
// NextRequest.ip; use @vercel/functions ipAddress() (platform-set,
// not spoofable). XFF is a last-resort fallback only.
function clientIp(req: NextRequest): string {
  return ipAddress(req)
      ?? req.headers.get('x-real-ip')
      ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? '127.0.0.1'
}

// Returns a 429 NextResponse when the caller is over budget, otherwise
// null (allow). `kind` selects the window: 'api' (default) or 'auth'
// (tighter, for /api/auth/*). Key on the authenticated user when known;
// IP only for unauthenticated traffic.
export async function checkRateLimit(
  req: NextRequest,
  kind: LimiterKind = 'api',
  userId?: string
): Promise<NextResponse | null> {
  const limiter = getLimiter(kind)
  if (!limiter) {
    if (!warnedUnconfigured) {
      console.warn(
        '[rate-limit] Upstash not configured — rate limiting DISABLED ' +
        '(fail-open). Set UPSTASH_REDIS_REST_URL and ' +
        'UPSTASH_REDIS_REST_TOKEN to enable.'
      )
      warnedUnconfigured = true
    }
    return null
  }

  const identity = userId ? `user:${userId}` : `ip:${clientIp(req)}`

  let result: Awaited<ReturnType<Ratelimit['limit']>>
  try {
    result = await limiter.limit(identity)
  } catch (err) {
    // Transient Upstash error — fail open rather than 500 the route.
    console.error('[rate-limit] limiter error — failing open:', err)
    return null
  }

  const { success, limit, reset, remaining } = result
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit':     limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset':     reset.toString(),
          'Retry-After':           Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }
  return null
}
