# my-app — SaaS scaffold (clone-me template)

This is a **materialized instance of the SaaS Master Framework**
(`~/Documents/MASTER_FRAMEWORK_REFERENCE.md`), with the 2026-05-18
review corrections already applied. Use it as the starting point for
new products.

## ⚠️ Scaffold-sync rule (read first — applies to every change)

This scaffold's only value is **not drifting** from the corrected
framework. Therefore, for **any** session, agent, or contributor
making changes here:

- When you change behavioral / security / schema / structural code,
  OR change the upstream Master Framework doc, you **must** apply the
  corresponding change to the rest of this scaffold **in the same
  change set** — migrations ↔ `supabase/tests/` ↔ `apps/*` ↔
  `packages/*` ↔ `planning/decisions/` ADRs ↔ `SCAFFOLD-NOTES.md` ↔
  this file.
- Treat sync as part of the change, not a follow-up. Pure prose/
  wording tweaks: note impact, don't churn.
- **Never close a change without an explicit `Scaffold sync:` line**
  stating what was synced (or "none — <reason>").

This is a *reasoning* rule, not automation: nothing enforces it
mechanically. It only happens because whoever edits this repo
consciously does it. It is not retroactive and does not run in the
background.

## Start a new product from this scaffold
1. Run `scripts/new-product.sh <name>` — it copies the scaffold to a new
   dir and performs steps 2 & 7 automatically (it never mutates this
   scaffold). Flags: `--owner <gh>` `--install` `--db` `--git`.
2. (Done by the script) Rename **only** the per-product scope `@ourelectedeurope/*`
   (config, ui, app package names) → `@your-product/*`; set `name` in root
   `package.json`, `supabase/config.toml` `project_id`, and app identifiers
   in `apps/mobile/app.json`. The five **`@gregdavid13/*` security
   packages are SHARED + versioned (#12) — they are deliberately NOT
   renamed**; once published, depend on them from GitHub Packages instead
   of carrying the copied source (see the versioned-packages ADR).
3. `pnpm install` from repo root.
4. **Validate the DB before building on it:** `supabase db start`
   then `supabase test db` — pgTAP must be green (these have never
   been executed; expect to adjust `auth.users` fixtures).
5. `supabase gen types typescript --local > packages/db/src/database.types.ts`
6. Fill `.env` from `.env.example`; `pnpm dev`.
7. Replace `@your-github-username` in `.github/CODEOWNERS`.

Full step-by-step: Master Framework Parts 6–9.

## Migrating an EXISTING app onto this architecture
Different from the clone path — see Master Framework **Part 12**. The
non-negotiable extra step is **Phase 0: a pre-flight security scan,
before any restructuring**, or you carry the app's existing
vulnerabilities into the new structure:
1. Grep for **hardcoded identity backdoors** (email/uid equality
   granting elevated roles) → env allowlist + one shared helper.
2. Find **fail-open auth** (role/RLS grants on query error/missing
   row) → make it fail closed.
3. Check **column-level self-escalation**: RLS can't restrict
   columns, so an own-row update policy lets a user set their own
   `role`/privilege column (self-promote). Guard with a BEFORE UPDATE
   trigger / column GRANTs. Also flag **recursive RLS** (policy
   subquerying its own table) → SECURITY DEFINER helper.
4. Scan source **and git history** for secrets/PII.
5. Then restructure (monorepo via `git mv`), adopt the *conventions*
   but keep the app's own schema, and treat data/auth as a planned,
   staged migration (ADR), never auto-applied.
6. **Repoint the deploy — in lockstep with the merge.** Vercel Root
   Directory must = `apps/web` for the monorepo, but it's ONE global
   setting for all deploys. Flipping it while `main` is still
   pre-conversion breaks production (no `apps/web` on `main`). Keep
   it at repo root until the monorepo is merged to the production
   branch; flip at cutover, not before.

(Lesson from the spearheadforums trial — see
`planning/decisions/2026-05-18-existing-app-migration-lessons.md`.)

## Structure (what's real vs stub)
- **Real, corrected code:** `supabase/migrations/` (0002–0008),
  `supabase/tests/` (pgTAP, CI-gated), `apps/web/middleware.ts`,
  `apps/web/lib/{env,rate-limit,audit,supabase-server,supabase-admin,
  require-admin}.ts`, `packages/{permissions,crypto,stripe}`,
  `.github/workflows/ci.yml`.
- **Re-exports** (security code is canonical in `packages/*`, #12):
  `apps/web/lib/{permissions,encrypt,stripe}.ts`.
- **Stubs** (header comment + framework pointer + TODO): all
  `app/**/page.tsx`, `components/**`, `apps/mobile/**`, webhook/cron/
  checkout route bodies. `apps/web/app/api/v1/user/profile/route.ts`
  is the **reference implementation** of the Flow 6 security order —
  copy its shape for every protected route.

## Building through this terminal — placement map (keep current)
For any "add a page / feature / route / context" request: name the
target path from this map and confirm **before** coding — don't explore
the tree to re-derive it (that rediscovery is the avoidable token cost
this map exists to remove). Adding/moving routes or context → update
this map in the **same change set** (reasoning rule, like scaffold-sync
above), so GitHub always matches and the next session needs no
re-exploration.

| Add a… | Path (under `apps/web/`) |
|---|---|
| Public page | `app/(marketing)/<seg>/page.tsx` |
| Authed screen | `app/(app)/<seg>/page.tsx` |
| Auth flow | `app/(auth)/<seg>/page.tsx` |
| Admin screen | `app/(admin)/admin/<seg>/page.tsx` |
| Client API | `app/api/v1/<name>/route.ts` — copy `…/user/profile/route.ts` (Flow 6) |
| Infra route | `app/api/{webhooks,cron,health}/…/route.ts` (unversioned) |
| Global context/state | `providers/<x>-context.tsx` → wire into root `app/layout.tsx` |
| Section-scoped context | that route group's `layout.tsx` |
| Consumer hook | `hooks/use<X>.ts` |
| Server-only logic/secrets | `lib/` |
| Reusable/security logic | `packages/*` (import, never copy) |

`providers/` is created on first use.

## Non-negotiable conventions (do not regress)
- Every table has RLS. Admin reads go through `is_admin()` (SECURITY
  DEFINER) — never an inline `admin_roles` subquery.
- Org membership writes require `is_org_admin()` — no self-add path.
- Protected API routes follow Flow 6 order exactly (rate-limit →
  validate → authn → tier → permission → logic → audit).
- Client-facing routes under `/api/v1/`; infra routes unversioned.
- Security-critical logic lives in `packages/*`, imported — not
  copied. The five security packages are versioned as
  `@gregdavid13/*` (#12, GitHub Packages); fix once + bump
  everywhere — never fork them into an app.
- `supabase test db` is a required CI check.
- Verify before closing any change: `corepack pnpm typecheck &&
  corepack pnpm test` (no standalone `pnpm` here — this repo pins
  `pnpm@9` via corepack).

## Workspaces (meta)
- `/planning` — specs, ADRs (the decision record for this scaffold's
  corrections lives in `planning/decisions/`), architecture.
- `/docs` — API docs, guides, changelog.
- `/ops` — deploy, monitoring, scripts.

## Read before trusting this scaffold
`SCAFFOLD-NOTES.md` — known gaps and unreviewed areas (encryption
AAD/rotation, Storage RLS unaudited, nothing executed, deferred
decisions). Read it before building features that touch those areas.
