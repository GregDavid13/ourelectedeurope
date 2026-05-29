-- pgTAP: is_admin() + admin-read RLS on the log tables.
-- Proves the fix from migration 0003/0006/0007/0008: the inline
-- `exists (select 1 from admin_roles ...)` was always false under RLS;
-- is_admin() (SECURITY DEFINER) must let an admin read, and must NOT
-- let a non-admin read. Positive case is asserted symmetrically across
-- ALL THREE log tables — that symmetry is the whole point of the fix.
begin;
select plan(9);

-- ── Fixtures (run as the test superuser → RLS bypassed for setup) ──
insert into auth.users (id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1','authenticated','authenticated','admin@test.local'),
  ('00000000-0000-0000-0000-0000000000b2','authenticated','authenticated','user@test.local');

insert into admin_roles (user_id, role)
  values ('00000000-0000-0000-0000-0000000000a1','super_admin');

insert into audit_log (actor_id, action)
  values ('00000000-0000-0000-0000-0000000000b2','user.login');
insert into security_events (event_type, user_id)
  values ('auth_failure','00000000-0000-0000-0000-0000000000b2');
insert into rate_limit_log (ip_address, endpoint, window_end)
  values ('203.0.113.7','/api/auth/login', now() + interval '1 minute');

-- ── is_admin() truth table ────────────────────────────────────────
select ok(     public.is_admin('00000000-0000-0000-0000-0000000000a1'::uuid),
  'is_admin() is true for a user in admin_roles' );
select ok( not public.is_admin('00000000-0000-0000-0000-0000000000b2'::uuid),
  'is_admin() is false for a user not in admin_roles' );

-- ── As the admin: reads return the row in ALL three log tables ────
reset role;
set local role authenticated;
set local request.jwt.claims to
  '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

select is( (select count(*)::int from audit_log),      1,
  'admin reads audit_log through is_admin()' );
select is( (select count(*)::int from security_events), 1,
  'admin reads security_events through is_admin()' );
select is( (select count(*)::int from rate_limit_log),  1,
  'admin reads rate_limit_log through is_admin()' );

-- admin_roles is deny-all: even an admin reading it directly gets
-- nothing (is_admin() works only because it is SECURITY DEFINER).
select is( (select count(*)::int from admin_roles), 0,
  'admin_roles deny-all holds even for an admin (direct select → 0 rows)' );

-- ── As the non-admin: RLS filters everything to zero rows ──────────
reset role;
set local role authenticated;
set local request.jwt.claims to
  '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';

select is( (select count(*)::int from audit_log),      0,
  'non-admin sees zero audit_log rows (RLS filters silently, no error)' );
select is( (select count(*)::int from security_events), 0,
  'non-admin sees zero security_events rows' );
select is( (select count(*)::int from rate_limit_log),  0,
  'non-admin sees zero rate_limit_log rows' );

select * from finish();
rollback;
