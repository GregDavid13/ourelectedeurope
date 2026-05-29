# 2026-05-18 RLS policy corrections to the Master Framework schema
Status: accepted

## Context
The Master Framework Reference schema (Part 4) shipped three Row Level
Security defects that fail silently — the SQL applies cleanly, so they
are invisible until exercised in production:

1. **Admin reads never resolve.** `audit_log`, `rate_limit_log`, and
   `security_events` gated reads with
   `exists (select 1 from admin_roles where user_id = auth.uid())`.
   `admin_roles` has a deny-all policy (`using (false)`). RLS applies
   to subqueries, evaluated as the querying user, so the `exists` is
   always false. Admins can never read the audit or security logs —
   the framework's headline security feature is inert.
2. **`team_members` policy is infinitely recursive.** The policy
   referenced `team_members` from inside its own policy. Postgres
   raises `infinite recursion detected in policy for relation
   "team_members"` on any query — the table is unusable.
3. **`feature_flags` uniqueness does not hold.** `unique(key, user_id)`
   and `unique(key, tier)` with both columns nullable: Postgres treats
   NULLs as distinct, so unlimited `(key, NULL)` rows are allowed and a
   single row could target both a user and a tier.

## Options considered
1. **Patch policies in place with SECURITY DEFINER helpers** —
   `is_admin()` / `is_team_member()` execute as a privileged owner and
   bypass the RLS that was blocking the subqueries. Minimal schema
   change, no data model change. Trade-off: definer functions must be
   written carefully (pinned `search_path`, `revoke from public`).
2. **Drop RLS on the log tables, enforce admin access only in the app
   layer** — simpler SQL, but removes defense-in-depth and contradicts
   the framework's "RLS on every table" principle.
3. **Re-model `team_members` around a separate `organizations` table** —
   fixes recursion structurally and addresses the user-is-an-org
   conflation, but is a larger change deferred to its own decision.

## Decision
Took option 1. The corrected, runnable migrations live in
`my-app/supabase/migrations/` (`0002`–`0008`):

- `0003_admin_roles.sql` adds `public.is_admin(uid)` —
  `security definer`, `set search_path = public`, execute revoked from
  `public` and granted only to `authenticated` / `service_role`.
- `0004_team_members.sql` adds `public.is_team_member(org_id, uid)` with
  the same hardening; the policy calls it instead of self-referencing.
- `0005_feature_flags.sql` replaces the two unique constraints with a
  scope `CHECK` (exactly one of user / tier / global) plus three
  partial unique indexes.
- `0006`–`0008` replace the dead `admin_roles` subquery with
  `public.is_admin()`.

Every changed file carries an inline `FIX (vs Master Framework)`
comment. The Master Framework Reference SQL was patched at the same
time so future products do not re-inherit the defects.

## Consequences
- **Easier:** admin/audit access works as designed; `team_members` is
  queryable; feature-flag scope is enforced by the database, not by
  convention.
- **Harder / accepted cost:** two SECURITY DEFINER functions now exist.
  They are a privilege boundary and must stay narrow — any change to
  them is a security-review item; `CODEOWNERS` should cover
  `supabase/migrations/`.
- **Deferred:** the user-is-an-org data model (option 3) and adding RLS
  policy tests (pgTAP) are tracked separately and not resolved here.
