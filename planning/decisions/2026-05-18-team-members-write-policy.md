# 2026-05-18 team_members write policy — close self-add escalation
Status: accepted

## Context
Surfaced while hardening the pgTAP tests for the RLS corrections
([[2026-05-18-rls-policy-corrections]]). The Master Framework's
`team_members` RLS was a single `for all` policy with a `USING` clause
and **no `WITH CHECK`**:

```sql
create policy "team_members_org_access" on team_members
  using ( org_id = auth.uid()
       or user_id = auth.uid()
       or <is a member of org_id> );
```

Postgres reuses the `USING` expression as the `WITH CHECK` for `INSERT`
when no `WITH CHECK` is defined. Because `USING` contains
`user_id = auth.uid()`, **any authenticated user could insert a
`team_members` row with their own `user_id` and an arbitrary victim's
`org_id`** — self-granting membership, which through
`team_members_read` + the `read:team_data` / `write:team_data`
permissions exposes that org's team data. This is a privilege
escalation, not a theoretical edge case.

This also corrects an imprecise statement in the original review, which
called the INSERT path "ambiguous/permissive." It is restrictive (USING
acts as WITH CHECK) — but the *content* of that expression is the hole.

## Options considered
1. **Split read vs. write; gate writes to org owner / admin member.**
   Add `is_team_admin()` (SECURITY DEFINER, same hardening as
   `is_team_member()`). Keep the broad read policy. No member
   self-claim path. Minimal, closes the hole, independent of the
   user-vs-org re-model.
2. **Add a narrow self-claim `WITH CHECK`** (e.g. user may set their
   own `user_id` only on a row whose `email` matches their JWT email
   and `user_id is null`). Closes the hole *and* keeps an
   invite-acceptance flow — but the framework never specified one, so
   this is inventing a feature under a security patch.
3. **Fold into the #10 user-vs-org re-model.** Correct long-term, but
   leaves a live escalation in the framework until that large decision
   is made.

## Decision
Took option 1. `team_members` now has four policies:
`team_members_read` (broad, unchanged read scope), and
`team_members_insert` / `_update` / `_delete`, each gated to
`org_id = auth.uid() or public.is_team_admin(org_id)`. There is no
self-add path. The org owner bootstraps because `org_id` references
their own `user_profiles` row, so `org_id = auth.uid()` is true for
them. Applied to `my-app/supabase/migrations/0004_team_members.sql`,
the Master Framework Part 4 SQL, and the `0002` pgTAP test (the
KNOWN-GAP `lives_ok` is now a `throws_ok` regression assertion plus an
owner-can-insert positive).

## Consequences
- **Closed:** the self-add escalation. Regression-tested.
- **Accepted cost / deferred:** there is no member invite-acceptance
  flow. The framework never had one; adding it (option 2's self-claim
  policy, or a server-side accept endpoint using the service role) is a
  feature decision tied to the #10 user-vs-org re-model and is
  explicitly out of scope here. Until then, membership is managed only
  by the org owner / an owner|admin member.
- **New surface:** a third SECURITY DEFINER function
  (`is_team_admin`). Same privilege-boundary review obligation as
  `is_admin` / `is_team_member`; `CODEOWNERS` over
  `supabase/migrations/` should cover it.
