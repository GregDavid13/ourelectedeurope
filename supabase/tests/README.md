# Database tests (pgTAP)

RLS regression tests for the migrations in `../migrations/`. They exist
because the original Master Framework schema applied cleanly but was
silently broken — these assertions fail loudly if the defects ever
return.

## What's covered

| File | Guards against |
|---|---|
| `0001_rls_admin_access_test.sql` | The `admin_roles` deny-all subquery making admin reads always-false. Asserts the `is_admin()` truth table, admin **can** read all three log tables (audit / security_events / rate_limit — symmetric positive), non-admin reads **zero** from each, and `admin_roles` deny-all holds even for an admin. |
| `0002_organizations_test.sql` | The org data model (migration 0004). Asserts personal-org auto-provisioning on signup, `is_org_member()`/`is_org_admin()` not recursing, read scoping (member/outsider), the self-add escalation staying closed, and owner/admin-only membership writes. |
| `0003_feature_flags_scope_test.sql` | Nullable unique constraints that didn't enforce scope. Asserts the scope CHECK + partial unique indexes reject dual-scope and duplicate rows. |
| `0004_user_profiles_test.sql` | `handle_new_user()` not firing / `users_own_profile` leaking. Asserts the trigger creates the profile row, and a user can read/write only its own profile. |

## Run

```bash
# Applies migrations to a throwaway local DB, then runs every *_test.sql
supabase test db
```

Requires the Supabase CLI and Docker. `supabase test db` enables the
`pgtap` extension itself; tests run inside a rolled-back transaction so
they leave no state.

**Environment assumption:** these tests rely on Supabase's standard
default privileges (`anon` / `authenticated` / `service_role` granted on
`public` tables). The framework migrations do **not** declare table
grants, so on a vanilla Postgres the `authenticated` role would hit
`permission denied` *before* RLS is ever evaluated. Real Supabase
(including the `supabase test db` image) sets these grants at bootstrap,
so the tests pass there. Flagged because it is a latent portability gap
in the framework, not a test bug.

## Status & known gaps

- **Unexecuted.** Written to current pgTAP/Supabase conventions but not
  yet run here (no Docker). Treat the first green `supabase test db` as
  part of validation, not a formality. Most likely first snag: the
  `auth.users` fixture inserts if a newer image adds NOT NULL columns.
- **Org data model (replaces user-as-org).** `team_members` →
  `organizations` + `organization_members` (migration 0004). The
  self-add escalation is closed by construction: no WITH CHECK
  references `user_id = auth.uid()`; membership writes require
  `is_org_admin()`. Personal org auto-created per user. See
  `planning/decisions/2026-05-18-org-data-model.md` and
  `2026-05-18-team-members-write-policy.md`. Still **no member
  invite-acceptance flow** (`joined_at` exists, no self-claim policy)
  and **billing remains per-user** — both deferred, own decisions.
- **Not covered:** `feature_flags_read` SELECT behavior (broad
  tier/global read is a separate open question, deliberately not
  test-locked); app-level flows (register → checkout → webhook → tier),
  `can()` permission matrix. These are #9's broader spirit, not this
  pass.
- These tests pin **current corrected behavior**. Where that behavior is
  itself debatable (the escalation above), the test name says so rather
  than silently blessing it.

## Conventions

- One transaction per file: `begin; select plan(N); … select * from finish(); rollback;`
- Fixtures are inserted as the test superuser (RLS bypassed for setup).
- To exercise a policy, switch identity with:
  ```sql
  reset role;
  set local role authenticated;
  set local request.jwt.claims to '{"sub":"<uuid>","role":"authenticated"}';
  ```
  `auth.uid()` reads `sub` from those claims. `reset role` before each
  switch returns to the superuser so the next fixture/role change works.
- Inserting into `auth.users` fires `handle_new_user()`, which creates
  the matching `user_profiles` row — rely on that rather than inserting
  profiles by hand. If a future Supabase image adds NOT NULL columns to
  `auth.users`, extend the fixture inserts here.

## Adding a test

New migration → new `NNNN_<topic>_test.sql` here, numbered to match.
Every RLS policy and every CHECK/partial-unique constraint should have
at least one positive and one negative assertion. This is the gate
referenced in the master doc's CI (`db-test` job) and Phase 7 checklist.
