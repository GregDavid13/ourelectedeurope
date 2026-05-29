-- pgTAP: organizations + organization_members (migration 0004).
-- Replaces the old team_members recursion test. Covers: personal-org
-- auto-provisioning, the SECURITY DEFINER membership predicates not
-- recursing, read scoping, and the self-add escalation staying closed
-- in the new model.
begin;
select plan(7);

-- ── Personal org auto-created on signup ───────────────────────────
insert into auth.users (id, aud, role, email)
  values ('00000000-0000-0000-0000-0000000000f1','authenticated','authenticated','f1@test.local');

select is(
  (select count(*)::int from organizations
     where owner_id = '00000000-0000-0000-0000-0000000000f1'),
  1,
  'handle_new_user_org() created a personal organization on signup' );
select is(
  (select count(*)::int from organization_members m
     join organizations o on o.id = m.org_id
    where o.owner_id = '00000000-0000-0000-0000-0000000000f1'
      and m.user_id  = '00000000-0000-0000-0000-0000000000f1'
      and m.role = 'owner'),
  1,
  'seed_org_owner() added the owner membership for the personal org' );

-- ── Explicit multi-member org (fixtures as superuser) ─────────────
insert into auth.users (id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000c3','authenticated','authenticated','owner@test.local'),
  ('00000000-0000-0000-0000-0000000000d4','authenticated','authenticated','member@test.local'),
  ('00000000-0000-0000-0000-0000000000b2','authenticated','authenticated','outsider@test.local');

-- Fixed-id org owned by c3. The on_organization_created trigger
-- seeds c3's 'owner' membership automatically.
insert into organizations (id, name, owner_id)
  values ('00000000-0000-0000-0000-00000000aaaa','Acme',
          '00000000-0000-0000-0000-0000000000c3');
insert into organization_members (org_id, user_id, email, role)
  values ('00000000-0000-0000-0000-00000000aaaa',
          '00000000-0000-0000-0000-0000000000d4','member@test.local','member');

-- ── As a member: no recursion, sees the roster ────────────────────
reset role;
set local role authenticated;
set local request.jwt.claims to
  '{"sub":"00000000-0000-0000-0000-0000000000d4","role":"authenticated"}';

select lives_ok( 'select * from organization_members',
  'querying organization_members as a member does not recurse' );
select is(
  (select count(*)::int from organization_members
     where org_id = '00000000-0000-0000-0000-00000000aaaa'),
  2,
  'member sees the full Acme roster (owner + self) via is_org_member()' );

-- ── As an outsider: cannot see or join Acme ───────────────────────
reset role;
set local role authenticated;
set local request.jwt.claims to
  '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';

select is(
  (select count(*)::int from organization_members
     where org_id = '00000000-0000-0000-0000-00000000aaaa'),
  0,
  'outsider sees zero rows for an org they do not belong to' );

-- Escalation regression: no self-add path. WITH CHECK is
-- is_org_admin(org_id) only — an outsider is rejected (42501).
select throws_ok(
  $$ insert into organization_members (org_id, user_id, email)
     values ('00000000-0000-0000-0000-00000000aaaa',
             '00000000-0000-0000-0000-0000000000b2','hax@test.local') $$,
  '42501',
  null,
  'ESCALATION STAYS FIXED — outsider cannot self-add to an org' );

-- ── Org admin can manage membership ───────────────────────────────
reset role;
set local role authenticated;
set local request.jwt.claims to
  '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}';
select lives_ok(
  $$ insert into organization_members (org_id, user_id, email)
     values ('00000000-0000-0000-0000-00000000aaaa', null, 'invited@acme.test') $$,
  'org owner/admin can add a member' );

select * from finish();
rollback;
