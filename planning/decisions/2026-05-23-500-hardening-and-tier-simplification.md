# 2026-05-23 500-error hardening + tier simplification
Status: accepted

## Context
Apps cloned from this scaffold kept returning `500 Internal Server`
errors. Root-causing (not the symptom in one product, but the scaffold
flaws every clone inherits) found two systemic causes plus several
fragile paths, and surfaced a piece of product-specific drift to remove
while in the area.

### Cause 1 — env validation was all-or-nothing (+ drift)
`apps/web/lib/env.ts` (@t3-oss/env-nextjs) validated **every**
integration var as required and fired at startup via
`instrumentation.ts`. So a clone 500'd on every route until *all* of
Supabase + Stripe + Upstash + Resend + encryption + cron were set.
Worse, the schema required three `STRIPE_PRICE_*` vars that were never
listed in `.env.example` — so even a faithfully-filled `.env` still
threw "Required", with no obvious culprit. This is the most likely
explanation for the recurring 500s.

### Cause 2 — the rate limiter could take down the whole API
`apps/web/lib/rate-limit.ts` called `Redis.fromEnv()` at module
top-level. That throws synchronously when Upstash env vars are absent,
and every protected `/api/v1` route imports the module as Flow 6 step
1 — so:
- with `SKIP_ENV_VALIDATION=1` (the recommended local-dev path) and
  Upstash unset, boot succeeded but **every** API route 500'd on
  import; and
- even fully configured, `checkRateLimit` had no error handling around
  the network `.limit()` call, so a transient Upstash blip became an
  unhandled 500.

### Collateral fragility
- Protected routes had no top-level try/catch — any unexpected throw
  became an opaque 500 with no server log.
- `writeAudit` could throw back into its caller (e.g. missing
  service-role key), turning a *successful* operation into a 500 at the
  audit step.
- `app/error.tsx` logged nothing, so 500s left no diagnostic trail.

### Product drift to remove
The `free | citizen | advocate | researcher` tiers were built for
another product and have no place in a reusable scaffold.

## Options considered
1. **Make integrations optional + validate at point of use (chosen).**
   Only Supabase publics are required to boot; everything else is
   `.optional()` and guarded where used. Departs from the framework's
   original "fail fast, never run half-configured" stance, but that
   stance is what 500'd every partially-configured clone. Format checks
   are retained (a malformed key is still rejected), so it's "fail fast
   on *wrong*, boot on *absent*."
2. Keep strict fail-fast, only fix the `.env.example` drift. Rejected:
   leaves the all-or-nothing footgun (and the rate-limit import throw)
   in place — a clone still can't boot to iterate until every
   integration is wired.

For the rate limiter: **fail open** (allow + log when Upstash is
unconfigured/unreachable) over **fail closed** (503). A scaffold is run
half-configured constantly; a limiter that 500s the API on a Redis blip
is worse than a brief unenforced window. The trade-off and the one-line
flip to fail-closed are documented in the file.

For tiers: **collapse to `free` only** over a generic `free + pro`
ladder. Keeps the scaffold a blank slate; the `Action` capability
vocabulary and a 4-step "add a tier" recipe stay in the policy file.

## Decision
Took option 1 + fail-open + free-only.

**500 hardening**
- `lib/env.ts`: required = `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` only;
  all else `.optional()`. `STRIPE_PRICE_*` removed (see tiers).
- `lib/rate-limit.ts`: lazy Redis/limiter singletons (import never
  throws); `checkRateLimit(req, kind, userId?)` where `kind` is
  `'api'|'auth'`; returns `null` (allow) + logs when unconfigured or on
  `.limit()` error.
- `app/api/v1/user/profile/route.ts` (the reference route every
  protected route copies): body wrapped in try/catch → logged generic
  500; updated to the new `checkRateLimit` signature.
- `lib/audit.ts`: `writeAudit` fully guarded — never throws back.
- `lib/supabase-admin.ts`: `createAdminClient` throws a clear error if
  URL/service-role key are missing (point-of-use guard for the now-
  optional key).
- `app/api/cron/{daily,weekly}/route.ts`: **fail closed** (503) when
  `CRON_SECRET` is unset — an unset secret must not make
  `Bearer undefined` a valid token.
- `app/error.tsx`: logs the error and renders the digest.
- `.env.example`: regrouped REQUIRED vs OPTIONAL; `SKIP_ENV_VALIDATION`
  documented; `STRIPE_PRICE_*` dropped.

**Tier simplification (`free` only)**
- `@ourelectedeurope/permissions`: `Tier = 'free'`; `PERMISSIONS = { free: [...] }`;
  `Action` union kept; add-a-tier recipe in the file header.
- `@ourelectedeurope/stripe`: `PLANS = {}`; `resolveTier` always returns `'free'`.
- Migrations `0002` + `0005`: `tier` CHECK narrowed to `('free')`.
- pgTAP `0003`: tier-scoped fixtures use `'free'`.
- `apps/web/lib/__tests__/permissions.test.ts`: rewritten for free-only.

## Consequences
- A fresh clone boots and serves pages with only Supabase configured;
  unconfigured features fail (clearly) only on the routes that need
  them, instead of 500ing the whole app at startup.
- Rate limiting silently degrades to allow-all when Upstash is absent —
  acceptable for dev, **must** wire Upstash in production (and consider
  fail-closed for genuinely abuse-sensitive routes).
- Re-adding a paid tier now touches four places (Tier type, PERMISSIONS,
  PLANS + `STRIPE_PRICE_*`, the `tier` CHECK in 0002/0005) — the policy
  file lists them.
- Verified headless: `pnpm typecheck` 8/8, `pnpm test` 3/3.
  `pnpm dev` / `supabase test db` boot paths still not executed here.

## Scaffold sync
`lib/env.ts` · `lib/rate-limit.ts` · `lib/audit.ts` ·
`lib/supabase-admin.ts` · `app/api/v1/user/profile/route.ts` ·
`app/api/cron/{daily,weekly}/route.ts` · `app/error.tsx` ·
`.env.example` · `packages/permissions/src/policy.ts` ·
`packages/stripe/src/plans.ts` · `supabase/migrations/0002`,`0005` ·
`supabase/tests/0003_feature_flags_scope_test.sql` ·
`apps/web/lib/__tests__/permissions.test.ts` · `SCAFFOLD-NOTES.md` ·
this ADR. CLAUDE.md needs no change: Flow 6 ordering and the placement
map are unchanged (the reference route's try/catch is additive); no
tier names appear there.
