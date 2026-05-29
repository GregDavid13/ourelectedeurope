-- ─────────────────────────────────────────────
-- 0003: Admin roles
-- ─────────────────────────────────────────────
create table admin_roles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('super_admin', 'view_admin')),
  granted_by  uuid references auth.users(id),
  granted_at  timestamptz default now()
);

alter table admin_roles enable row level security;

-- Deny all direct access. The table is managed only via the
-- service-role key (which bypasses RLS entirely). No client,
-- not even an admin, queries this table directly.
create policy "admin_roles_deny_all" on admin_roles
  using (false);

-- ── FIX (vs Master Framework) ────────────────────────────────────
-- The framework gated audit_log / rate_limit_log / security_events
-- reads with:  exists (select 1 from admin_roles where user_id = auth.uid())
-- That subquery runs AS THE QUERYING USER, and RLS applies to
-- subqueries too. Because admin_roles denies all selects (above),
-- the exists() is ALWAYS false — so admins could never read the
-- audit log. The fix is a SECURITY DEFINER function: it executes as
-- its owner (a privileged role) and therefore bypasses the
-- admin_roles RLS policy. Every admin-read policy calls this instead.
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_roles where user_id = uid
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated, service_role;
