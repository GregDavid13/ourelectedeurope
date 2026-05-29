-- pgTAP: feature_flags scope is enforced by the database.
-- Before the fix, nullable unique(key,user_id)/unique(key,tier) let
-- unlimited (key, NULL) rows exist and a row could target both a user
-- and a tier. The scope CHECK + partial unique indexes (migration
-- 0005) close both holes. Constraints are RLS-independent, so this
-- runs as the test superuser.
begin;
select plan(7);

insert into auth.users (id, aud, role, email)
  values ('00000000-0000-0000-0000-0000000000e5','authenticated','authenticated','flag@test.local');

-- ── CHECK: a flag must have exactly one scope ─────────────────────
select throws_ok(
  $$ insert into feature_flags (key, user_id, tier)
     values ('beta','00000000-0000-0000-0000-0000000000e5','free') $$,
  '23514',
  null,
  'row targeting BOTH a user and a tier is rejected by the scope CHECK' );

-- ── Valid rows, one per scope ─────────────────────────────────────
select lives_ok(
  $$ insert into feature_flags (key, user_id)
     values ('beta','00000000-0000-0000-0000-0000000000e5') $$,
  'a user-scoped flag inserts' );
select lives_ok(
  $$ insert into feature_flags (key, tier) values ('beta','free') $$,
  'a tier-scoped flag with the same key inserts (different scope)' );
select lives_ok(
  $$ insert into feature_flags (key) values ('beta') $$,
  'a global flag with the same key inserts' );

-- ── Partial unique indexes: no dupes within a scope ───────────────
select throws_ok(
  $$ insert into feature_flags (key, user_id)
     values ('beta','00000000-0000-0000-0000-0000000000e5') $$,
  '23505',
  null,
  'duplicate user-scoped flag (key,user_id) is rejected' );
select throws_ok(
  $$ insert into feature_flags (key, tier) values ('beta','free') $$,
  '23505',
  null,
  'duplicate tier-scoped flag (key,tier) is rejected' );
select throws_ok(
  $$ insert into feature_flags (key) values ('beta') $$,
  '23505',
  null,
  'second global flag with the same key is rejected' );

select * from finish();
rollback;
