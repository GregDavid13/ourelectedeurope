# 2026-05-18 Organization data model — orgs as first-class entities
Status: accepted

## Context
The Master Framework modelled teams as
`team_members.org_id references user_profiles(id)` — i.e. a user *was*
an organization. This conflation breaks as soon as a user belongs to
more than one org or an org outlives its creating user, and unwinding
it after products ship is a painful data migration. The
[[2026-05-18-team-members-write-policy]] escalation fix closed the
immediate security hole but explicitly left the modelling smell open;
this decision resolves it.

## Options considered
1. **Additive org model (chosen).** New `organizations` +
   `organization_members` tables. Every user gets a personal org on
   signup (trigger), so the single-user path stays zero-config.
   Membership writes gated to org owner/admin via SECURITY DEFINER
   predicates — the escalation fix carried forward by construction
   (no `user_id = auth.uid()` in any WITH CHECK).
2. **Keep user-as-org, document the limitation.** Zero work now, but
   every product inherits the conflation and the expensive migration
   is just deferred onto whoever scales first.
3. **Move billing to the org in the same pass.** Correct long-term
   (team plans bill per-org) but cascades through Flow 4/5, webhooks,
   `tier`, permissions, and reconciliation — too large to bundle
   safely. Deferred to its own decision.

## Decision
Took option 1. Migration `0004` (renamed
`0004_team_members.sql` → `0004_organizations.sql`):

- `organizations(id, name, owner_id → auth.users, created_at)`.
- `organization_members(id, org_id → organizations, user_id, email,
  role, invited_at, joined_at, unique(org_id,email))`.
- `is_org_member()` / `is_org_admin()` — SECURITY DEFINER, hardened
  (`search_path` pinned, execute revoked from `public`).
- RLS: members read; **only org owner/admin write** — no self-add.
- `seed_org_owner()` trigger on `organizations` insert creates the
  owner membership (solves the empty-org bootstrap, and is the only
  producer of an `owner` row). `handle_new_user_org()` trigger on
  `auth.users` insert creates each user's personal org.
- `0002` pgTAP test rewritten for the new model (personal-org
  provisioning, no recursion, read scoping, escalation regression,
  owner-can-manage). Master doc Part 4 SQL, Part 2 tree, audit
  actions (`org.*`), and the permissions block (tier vs org-role
  orthogonality) updated to match.

## Consequences
- **Fixed:** the user-is-an-org conflation; multi-org membership is
  now representable. Escalation stays closed by construction.
- **Orthogonal axes made explicit:** `tier` = billing capability
  (`can(tier, …)`); `organization_members.role` = within-org
  authority (RLS). A correct team write needs both.
- **Deferred (own decisions):** billing-per-org (option 3); a member
  invite-acceptance flow (still none — `joined_at` exists but no
  self-claim policy; a server-side accept endpoint using the service
  role is the intended shape). Personal org is named "Personal" with
  no rename UX yet.
- **New surface:** two more SECURITY DEFINER functions + two triggers
  on `auth.users`/`organizations`. Same privilege-review obligation;
  `CODEOWNERS` over `supabase/migrations/` covers them.
- **Not executed:** like all migrations here, validated by reasoning
  + pgTAP source, not yet run against Postgres.
