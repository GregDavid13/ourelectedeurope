-- pgTAP: handle_new_user() trigger + users_own_profile policy
-- (migration 0002). 0002's team test relies on the trigger
-- implicitly; this asserts it directly, plus the own-profile
-- read/write isolation that the rest of the schema assumes.
begin;
select plan(5);

-- ── Trigger: inserting auth.users auto-creates user_profiles ──────
insert into auth.users (id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000f6','authenticated','authenticated','f6@test.local'),
  ('00000000-0000-0000-0000-0000000000a7','authenticated','authenticated','a7@test.local');

select is(
  (select count(*)::int from user_profiles
     where id = '00000000-0000-0000-0000-0000000000f6'),
  1,
  'handle_new_user() created a user_profiles row on auth.users insert' );

-- ── As f6: sees only its own profile ──────────────────────────────
reset role;
set local role authenticated;
set local request.jwt.claims to
  '{"sub":"00000000-0000-0000-0000-0000000000f6","role":"authenticated"}';

select is( (select count(*)::int from user_profiles), 1,
  'users_own_profile: f6 sees exactly one row (its own)' );
select is(
  (select count(*)::int from user_profiles
     where id = '00000000-0000-0000-0000-0000000000a7'),
  0,
  'users_own_profile: f6 cannot see another user''s profile' );

-- ── As f6: can write own, cannot write another's ──────────────────
select lives_ok(
  $$ update user_profiles set full_name = 'F Six'
     where id = '00000000-0000-0000-0000-0000000000f6' $$,
  'f6 can update its own profile' );

-- Updating a7's row affects zero rows: RLS filters it out of the
-- update set silently (no error, no write).
select is(
  ( with u as (
      update user_profiles set full_name = 'hijacked'
       where id = '00000000-0000-0000-0000-0000000000a7'
      returning 1
    ) select count(*)::int from u ),
  0,
  'f6 cannot update another user''s profile (0 rows affected, no error)' );

select * from finish();
rollback;
