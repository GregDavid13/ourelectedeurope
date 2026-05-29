import { createEnv } from '@t3-oss/env-nextjs'
import { z }         from 'zod'

// Zod-validated env. Posture (changed 2026-05-23 — see SCAFFOLD-NOTES
// "Boot gotcha"): only the vars the app genuinely cannot run without
// (Supabase) are REQUIRED. Every integration (Stripe, Upstash, Resend,
// encryption, cron, admin allowlist) is OPTIONAL here and validated at
// its point of use instead — so a partially-configured clone boots and
// serves pages, and only the routes that actually need a given secret
// fail (with a clear error) until you wire it.
//
// Rationale: the old all-or-nothing schema threw at startup
// (instrumentation.ts) the moment ANY var was blank, which 500'd every
// route on a fresh clone. Optional-with-format-check keeps the
// fail-fast value (a malformed key is still rejected) without blocking
// boot on features you haven't set up yet.
//
// Note: nothing reads the typed `env` object at runtime — the clients
// read `process.env.X` directly — so this schema governs *startup
// validation*, not consumer types. Point-of-use guards live in
// supabase-admin.ts, rate-limit.ts, crypto/aes.ts and the cron routes.
export const env = createEnv({
  server: {
    // Optional: blank → skipped; present → must be well-formed.
    SUPABASE_SERVICE_ROLE_KEY:  z.string().min(1).optional(),
    STRIPE_SECRET_KEY:          z.string().startsWith('sk_').optional(),
    STRIPE_WEBHOOK_SECRET:      z.string().startsWith('whsec_').optional(),
    CRON_SECRET:                z.string().min(32).optional(),
    SUPER_ADMIN_EMAILS:         z.string().min(1).optional(),
    RESEND_API_KEY:             z.string().startsWith('re_').optional(),
    ENCRYPTION_KEY:             z.string().length(64).optional(),
    UPSTASH_REDIS_REST_URL:     z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN:   z.string().min(1).optional(),
  },
  client: {
    // The only hard requirement: without Supabase the app can do nothing.
    NEXT_PUBLIC_SUPABASE_URL:           z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY:      z.string().min(1),
    // Optional: billing UI / absolute links / redirects.
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
    NEXT_PUBLIC_APP_URL:                z.string().url().optional(),
  },
  runtimeEnv: {
    SUPABASE_SERVICE_ROLE_KEY:          process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY:                  process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET:              process.env.STRIPE_WEBHOOK_SECRET,
    CRON_SECRET:                        process.env.CRON_SECRET,
    SUPER_ADMIN_EMAILS:                 process.env.SUPER_ADMIN_EMAILS,
    RESEND_API_KEY:                     process.env.RESEND_API_KEY,
    ENCRYPTION_KEY:                     process.env.ENCRYPTION_KEY,
    UPSTASH_REDIS_REST_URL:             process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN:           process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_SUPABASE_URL:           process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL:                process.env.NEXT_PUBLIC_APP_URL,
  },
  // Treat blank values (e.g. unset keys in .env) as missing, not "".
  emptyStringAsUndefined: true,
  // Allow `SKIP_ENV_VALIDATION=1` to bypass validation entirely for
  // local dev / CI builds. Validation still runs normally when absent.
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
