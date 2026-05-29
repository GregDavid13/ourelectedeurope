# Scaffold notes — known gaps & honest status

This scaffold materializes the corrected SaaS Master Framework. It is
**sound in design for the reviewed surface**, not "complete." Read
this before depending on it.

## Verification status (2026-05-18)
PROVEN headless: `pnpm install` ✓ · `pnpm typecheck` ✓ (8/8
packages) · `pnpm test` ✓ (3/3, re-run 2026-05-23). Toolchain note: no
standalone `pnpm` here — use `corepack` (repo pins `pnpm@9` via
`packageManager`).

NOT yet run: `pnpm dev` (Next dev server — needs `apps/web/.env` with
at least the two Supabase publics; integrations are optional, see the
Boot gotcha section) and
`supabase test db` (needs Docker + a running Supabase; the pgTAP
suite is still source-validated only — most likely first snag is the
`auth.users` fixture inserts if your image marks more columns NOT
NULL).

## apps/ troubleshooting — fixed & verified
- **`turbo.json` used `pipeline`** (turbo <2.0 schema) → turbo 2.x
  hard-fails. Renamed to `tasks`. Synced to master doc Part 11.
- **`packages/crypto/src/aes.ts`** (copied faithfully from the master
  doc) didn't typecheck: Node `Buffer` is not a Web Crypto
  `BufferSource`, `split(':')` was `string|undefined` under
  `noUncheckedIndexedAccess`, and TS 5.7+ made `Uint8Array` generic.
  Rewritten Uint8Array-based with input validation; synced to master
  doc Part 5.
- **Missing type deps**: added `@types/node` (crypto, stripe),
  `@types/react`/`@types/react-dom`/`@types/node` (web), `@types/react`
  (ui); crypto tsconfig given `lib:["ES2022","DOM"]`+`types:["node"]`,
  stripe `types:["node"]`.
- **`database.types.ts`** placeholder: a stricter type makes
  supabase-js generics collapse to `never`. Final placeholder is
  `export type Database = any` (untyped until codegen). **You still
  must run `pnpm --filter @ourelectedeurope/db gen:types`** for any column
  safety — until then the DB is effectively untyped.
- **`@supabase/ssr` `setAll`** callbacks were implicit-`any` under
  strict; annotated with `CookieToSet`/`CookieOptions` and switched to
  the object-form `set({name,value,...options})` (supabase-server +
  middleware).
- The six `packages/*` had `tsconfig extends "@ourelectedeurope/config/..."`
  but did not depend on `@ourelectedeurope/config` → pnpm wouldn't link it →
  package typecheck broken. Added `@ourelectedeurope/config` + `typescript`
  devDeps and a `typecheck` script to each.
- `import 'server-only'` had no explicit dependency → added to
  apps/web.
- RN tsconfig used classic `jsx: react-native` (needs `import React`
  in every file). Switched to `jsx: react-jsx` (automatic runtime,
  fine on Expo 52 / RN 0.76).
- **ESLint not configured in `apps/web`** (found 2026-05-22 on the
  bluecheeseprocurement clone): `next lint` had no config or deps, so
  it dropped into an interactive setup prompt and hung/failed
  non-interactively (CI). Added `.eslintrc.json`
  (`extends: next/core-web-vitals`) + `eslint`/`eslint-config-next`
  devDeps. (`next lint` is deprecated in Next 15.5 → migrate to the
  ESLint CLI before Next 16.)
- **Mobile (`apps/mobile`) Expo export — two issues** (same date). (1)
  Missing `"main": "expo-router/entry"` → Expo fell back to
  `AppEntry.js` and failed to resolve a non-existent root `App`
  (`Unable to resolve module ../../App`). Fixed. (2) Expo SDK 52
  transitive drift: `expo-router@~4.0.0` pulls
  `react-native-screens@4.25.1` (targets RN ≥0.82) which breaks RN
  0.76 codegen (`Unknown prop type for "type"`). Pinned via root pnpm
  `overrides` (`react-native-screens: ~4.4.0`, applies on a CLEAN
  install) and bumped `react-native` to 0.76.9. Until mobile work
  starts, the mobile `build` is a no-op echo so `pnpm build` is green;
  restore `expo export -p ios -p android` after a clean install to
  enable. Mobile still typechecks. (Verified on the clone, not re-run
  in this scaffold.)
- **Recurring `500 Internal Server` errors — root-caused & fixed
  (2026-05-23).** Clones kept 500-ing for two systemic reasons, both
  inherited by every copy. Full write-up:
  `planning/decisions/2026-05-23-500-hardening-and-tier-simplification.md`.
  - **Env drift + all-or-nothing validation.** `lib/env.ts` required
    three `STRIPE_PRICE_*` vars that were never in `.env.example`, and
    the schema threw at startup the moment ANY var was blank — so a
    freshly-filled `.env` still failed `instrumentation.ts` and 500'd
    every route. Fix: only Supabase publics are required; all
    integrations are `.optional()` and guarded at point of use. (The
    `STRIPE_PRICE_*` vars are gone entirely with the tier removal
    below.)
  - **Rate limiter took down the whole API.** `lib/rate-limit.ts` ran
    `Redis.fromEnv()` at module top-level, so *importing* it threw when
    Upstash was unset — and every protected route imports it as Flow 6
    step 1. With `SKIP_ENV_VALIDATION=1` (recommended for local dev)
    boot succeeded but every `/api/*` route 500'd on import. Even
    configured, `.limit()` had no error handling, so one Upstash blip
    → unhandled 500. Fix: lazy client (import never throws) + **fail
    open** with logging when unconfigured/unreachable. Flip to a 503 in
    `checkRateLimit` for fail-closed.
  - **Collateral hardening:** every protected route now wraps its body
    in a try/catch (logged 500 instead of an opaque crash — copied via
    the reference route); `writeAudit` can no longer throw back into a
    caller (a failed/unconfigured audit write won't 500 a successful
    op); `createAdminClient` guards the now-optional service-role key
    with a clear error; the cron routes **fail closed** if `CRON_SECRET`
    is unset (an unset secret would otherwise make `Bearer undefined`
    valid); `app/error.tsx` now logs and shows the error digest.
  - Proven headless: `pnpm typecheck` (8/8) + `pnpm test` (3/3) green
    after the change. `pnpm dev` boot path still not executed here.
- **Paid tiers removed — scaffold ships `free` only (2026-05-23).** The
  Citizen / Advocate / Researcher tiers were product-specific. Removed
  from `@ourelectedeurope/permissions` (`Tier = 'free'`), `@ourelectedeurope/stripe`
  (`PLANS = {}`, `resolveTier` always `'free'`), the `tier` CHECK in
  migrations 0002 + 0005, the pgTAP scope test (0003), and the
  permissions unit test. The `Action` capability vocabulary is kept
  intact as the menu for re-adding a tier — the policy file documents
  the 4-step add procedure. Same ADR as above.
- Still **not executed**: `pnpm install` is required to create the
  workspace symlinks before `tsc`/`vitest`/`next` resolve `@ourelectedeurope/*`
  and `@/`. Wiring is now correct by construction; prove it with
  `pnpm install && pnpm typecheck && pnpm test && pnpm dev`.

## Boot gotcha (Zod env validation + env file location)
`lib/env.ts` (@t3-oss/env-nextjs) fires via `instrumentation.ts` at
startup. **Posture changed 2026-05-23 (see the 500-hardening entry
above and the ADR):** only the two Supabase public vars are REQUIRED;
every integration (Stripe / Upstash / Resend / encryption / cron /
admin allowlist) is now OPTIONAL and validated at its point of use. A
partially-configured clone boots and serves pages — it no longer 500s
every route because one secret is blank. Things to know (the first two
were hit on 2026-05-23 bringing up a hosted Supabase on a clone):

1. **The env file lives in `apps/web/.env`, NOT the repo root.**
   `next dev` runs with its cwd in `apps/web`, so Next only loads
   `apps/web/.env*`. The root `.env.example` is just the reference
   list — copy it to `apps/web/.env` and fill it. A root `.env` is
   silently ignored by the web app (symptom: every var reports
   "Required" even though you set them).
2. **`SKIP_ENV_VALIDATION=1` now actually works.** `env.ts` was missing
   `skipValidation`, so the flag did nothing and dev/build threw even
   when you only wanted Supabase configured. Added
   `skipValidation: !!process.env.SKIP_ENV_VALIDATION` (+
   `emptyStringAsUndefined: true`). Use it for local dev / CI before
   every secret is wired:
   `SKIP_ENV_VALIDATION=1 pnpm --filter @ourelectedeurope/web dev`.
   Validation still runs normally when the flag is absent (CI should
   provide the real server vars as secrets).

## Request lifecycle (read before debugging a 500 / auth issue)
The path a request takes and which file reads which env var — so a
runtime bug can be traced without re-reading the whole `apps/web/lib`
tree. (Hardening posture:
`planning/decisions/2026-05-23-500-hardening-and-tier-simplification.md`.)

- **Startup (once).** `instrumentation.ts` imports `lib/env.ts`, which
  Zod-validates env on the Node runtime. Post-2026-05-23 only the two
  `NEXT_PUBLIC_SUPABASE_*` vars are required; a blank optional var no
  longer crashes boot.
- **Every request hits `middleware.ts` first** (matcher skips
  `_next`/static/dotted files). It mints a CSP nonce, builds a Supabase
  server client from request cookies, calls `auth.getUser()` to refresh
  the session, redirects `/dashboard`·`/settings`·`/onboarding` →
  `/login` when signed-out (and `/login`·`/register` → `/dashboard`
  when signed-in), and applies security headers to **every** response.
- **Protected API route → Flow 6** (reference:
  `app/api/v1/user/profile/route.ts`, whole body in try/catch):
  rate-limit → validate → authn → per-user rate tier → load tier →
  `can()` permission → business logic (RLS enforces row ownership) →
  audit.
- **Where each env var is read (the debug map):**
  - `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` → `middleware.ts` +
    `lib/supabase-server.ts` (required; user context, RLS on).
  - `SUPABASE_SERVICE_ROLE_KEY` → `lib/supabase-admin.ts` (guarded;
    bypasses RLS — audit, `requireAdmin`, webhooks, cron).
  - `UPSTASH_REDIS_REST_URL`/`TOKEN` → `lib/rate-limit.ts` (lazy;
    absent or erroring ⇒ **fail open**: request allowed + logged).
  - `CRON_SECRET` → `app/api/cron/{daily,weekly}` (unset ⇒ **fail
    closed**, 503).
  - `ENCRYPTION_KEY` → `packages/crypto/src/aes.ts` (read at use;
    throws if absent). `STRIPE_*` → `packages/stripe/*`.
    `RESEND_API_KEY` → `lib/email.ts`.
- **So when something 500s:** a missing *optional* var fails only the
  route that needs it (clear error, now caught + logged) — not boot;
  rate-limit never 500s (fails open); audit never throws; cron fails
  closed. Read the server log line the route's try/catch emits and the
  `error.tsx` digest before grepping.

## Unreviewed / known-gap areas (fix before features that touch them)
1. **Field encryption** (`packages/crypto/src/aes.ts`): single static
   key, no AAD (ciphertext not bound to its column/row), no key id /
   rotation. Fix before storing real encrypted PII.
2. **Supabase Storage RLS** (Master Framework Part 7): the
   `storage.objects` bucket policies were never audited and use the
   same `using`-without-`with check` shape that produced the
   `team_members` escalation. Audit before building file upload.
3. **Webhook handler / Stripe flows**: only the *ordering and
   guidance* exist (Flow 4/5, #11 idempotency). The actual
   `packages/stripe/src/webhooks.ts` and checkout/mobile routes are
   stubs (501).

## Deferred by explicit decision (see planning/decisions/)
- Billing is **per-user** (`user_profiles.tier`), not per-org. Team
  plans not modelled. — `2026-05-18-org-data-model.md`. The scaffold
  now ships **`free` only** (paid tiers removed 2026-05-23 —
  `2026-05-23-500-hardening-and-tier-simplification.md`); add a tier
  per product.
- No member **invite-acceptance** flow (`joined_at` exists, no
  self-claim policy; intended shape is a service-role accept
  endpoint).
- **Org-ownership transfer**: `organizations.owner_id` is
  `on delete cascade` — deleting the owner destroys the org and all
  memberships. True org independence needs transfer, not cascade.
- Within-org authority is coarse: any owner/admin may modify any
  membership incl. owners (no last-owner protection).
- **#12 packaging — in-repo extraction DONE (2026-05-24), live publish
  gated.** The five security packages are now versioned + publishable as
  `@gregdavid13/{crypto,permissions,validators,stripe,db}` (GitHub
  Packages): CJS `build` → `dist/`, `publishConfig`, Changesets
  (`.changeset/`, root `release` script), `.npmrc`, and
  `.github/workflows/release.yml`. `ui` + `config` stay internal
  (`@ourelectedeurope/*`). The clone-consume path is built too:
  `new-product.sh --thin` makes a product depend on the published
  `@gregdavid13/*` (instead of copying source) + ships a
  `dependabot.yml`. What remains is **only the credentialed publish** —
  this scaffold becoming a GitHub repo under the `@gregdavid13` owner +
  a `write:packages` token, then the first publish / "Version Packages"
  PR merge. Step-by-step: `ops/release-packages.md`. Until you publish, a
  default clone carries copied source and does NOT inherit fixes via a
  bump (and `--thin` clones can't install yet). Full record + warts:
  `2026-05-18-versioned-packages.md` (Update 2026-05-24).

## Where the rationale lives
`planning/decisions/2026-05-18-*.md` — RLS corrections, the
team_members write-policy escalation, the org data model, versioned
packages. The master doc footer has a dated changelog of every
correction.
