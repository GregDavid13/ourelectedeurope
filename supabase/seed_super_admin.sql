-- ============================================================
-- Seed: grant super_admin to the bootstrap owner.
-- ============================================================
-- Run this in the Supabase SQL Editor (it runs as a privileged role,
-- so it bypasses the admin_roles deny-all RLS policy).
--
-- PREREQUISITE: the account must already exist in auth.users —
-- i.e. craigbelluche@gmail.com must have REGISTERED (and, if email
-- confirmation is on, confirmed) via /register first. admin_roles.user_id
-- is a FK to auth.users(id); there is nothing to grant the role to until
-- that row exists. If the account hasn't signed up yet this script
-- raises a clear error instead of silently doing nothing.
--
-- Idempotent: safe to re-run. If a row already exists it is upgraded to
-- super_admin.
--
-- NOTE: the app also treats anyone in the SUPER_ADMIN_EMAILS env var as a
-- super admin (see apps/web/lib/require-admin.ts). That env allowlist is
-- the zero-DB bootstrap path; this table row is the durable record.

do $$
declare
  v_email text := 'craigbelluche@gmail.com';
  v_id    uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(v_email);

  if v_id is null then
    raise exception
      'No auth.users row for % — register/confirm that account first, then re-run.', v_email;
  end if;

  insert into public.admin_roles (user_id, role, granted_by)
  values (v_id, 'super_admin', v_id)
  on conflict (user_id) do update set role = 'super_admin';

  raise notice 'Granted super_admin to % (user_id %)', v_email, v_id;
end $$;

-- Verify:
-- select u.email, a.role, a.granted_at
-- from public.admin_roles a join auth.users u on u.id = a.user_id;
