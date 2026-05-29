-- ============================================================
-- ourelectedeurope — combined schema migrations (0002-0008)
-- Generated for manual paste into the Supabase SQL Editor.
-- Source of truth: supabase/migrations/*.sql (edit those, regenerate).
-- Wrapped in a single transaction: all-or-nothing.
-- ============================================================

begin;

-- vvv migrations/0002_user_profiles.sql vvv
-- ─────────────────────────────────────────────
-- 0002: User profiles (extends Supabase auth.users)
-- ─────────────────────────────────────────────
-- Unchanged from the Master Framework. Included so this migration
-- set runs top-to-bottom as a coherent whole.

create extension if not exists pgcrypto;

create table user_profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  full_name               text,
  avatar_url              text,
  -- Scaffold ships one tier. Widen this CHECK when you add paid tiers
  -- (keep it in sync with @ourelectedeurope/permissions `Tier` + migration 0005).
  tier                    text not null default 'free'
                            check (tier in ('free')),
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  stripe_price_id         text,
  trial_ends_at           timestamptz,
  onboarding_complete     boolean default false,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

alter table user_profiles enable row level security;

-- Users can only read/write their own profile
create policy "users_own_profile" on user_profiles
  using (id = auth.uid())
  with check (id = auth.uid());

-- Auto-create profile on signup. security definer = runs as the
-- function owner and bypasses RLS, which is why the insert succeeds
-- before the user has a session.
--
-- `set search_path = public` + a schema-qualified table are REQUIRED:
-- the trigger fires in the auth admin's context (whose search_path does
-- not include public), so an unqualified `user_profiles` fails to
-- resolve and the entire auth.users insert aborts with "Database error
-- saving new user". (Migrations 0004's triggers already do this.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ^^^ end migrations/0002_user_profiles.sql ^^^

-- vvv migrations/0003_admin_roles.sql vvv
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

-- ^^^ end migrations/0003_admin_roles.sql ^^^

-- vvv migrations/0004_organizations.sql vvv
-- ─────────────────────────────────────────────
-- 0004: Organizations + memberships
-- ─────────────────────────────────────────────
-- Replaces the old `team_members.org_id references user_profiles(id)`
-- model, where a user *was* an org. Now an organization is a
-- first-class entity. Additive: every user gets a personal org on
-- signup, so the single-user path is unchanged. See ADR
-- planning/decisions/2026-05-18-org-data-model.md.

create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now()
);

create table organization_members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  email       text not null,
  role        text not null default 'member'
                check (role in ('owner','admin','member','viewer')),
  invited_at  timestamptz default now(),
  joined_at   timestamptz,
  unique (org_id, email)
);

alter table organizations        enable row level security;
alter table organization_members enable row level security;

create index organization_members_org_idx  on organization_members (org_id);
create index organization_members_user_idx on organization_members (user_id);

-- SECURITY DEFINER membership predicates — same rationale as
-- is_admin()/is_team_member() in 0003/earlier: a self-referential
-- subquery inside an organization_members policy would recurse, and
-- a plain subquery would be filtered by RLS. Definer bypasses both.
create or replace function public.is_org_member(p_org_id uuid, uid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_members
    where org_id = p_org_id and user_id = uid
  );
$$;
revoke all on function public.is_org_member(uuid, uuid) from public;
grant execute on function public.is_org_member(uuid, uuid) to authenticated, service_role;

create or replace function public.is_org_admin(p_org_id uuid, uid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_members
    where org_id = p_org_id and user_id = uid and role in ('owner','admin')
  );
$$;
revoke all on function public.is_org_admin(uuid, uuid) from public;
grant execute on function public.is_org_admin(uuid, uuid) to authenticated, service_role;

-- ── organizations RLS ────────────────────────────────────────────
create policy "organizations_read" on organizations
  for select using ( owner_id = auth.uid() or public.is_org_member(id) );

create policy "organizations_insert" on organizations
  for insert with check ( owner_id = auth.uid() );

create policy "organizations_update" on organizations
  for update using      ( public.is_org_admin(id) )
            with check  ( public.is_org_admin(id) );

create policy "organizations_delete" on organizations
  for delete using ( owner_id = auth.uid() );

-- ── organization_members RLS ─────────────────────────────────────
-- Read: members see their org's roster. Write: only org owner/admin.
-- Carries forward the escalation fix — there is NO self-add path
-- (no `user_id = auth.uid()` in any WITH CHECK).
create policy "org_members_read" on organization_members
  for select using ( user_id = auth.uid() or public.is_org_member(org_id) );

create policy "org_members_insert" on organization_members
  for insert with check ( public.is_org_admin(org_id) );

create policy "org_members_update" on organization_members
  for update using      ( public.is_org_admin(org_id) )
            with check  ( public.is_org_admin(org_id) );

create policy "org_members_delete" on organization_members
  for delete using ( public.is_org_admin(org_id) );

-- ── Bootstrap ────────────────────────────────────────────────────
-- An org has no members at creation, so is_org_admin() would be
-- false and nobody could add the first member. seed_org_owner()
-- (SECURITY DEFINER → bypasses RLS) inserts the owner membership in
-- the same transaction as the org. This is the ONLY way an 'owner'
-- row is created; the human flow and the signup trigger both rely
-- on it.
create or replace function public.seed_org_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organization_members (org_id, user_id, email, role, joined_at)
  values (
    new.id,
    new.owner_id,
    coalesce((select email from auth.users where id = new.owner_id), 'owner@unknown'),
    'owner',
    now()
  );
  return new;
end;
$$;

create trigger on_organization_created
  after insert on organizations
  for each row execute procedure public.seed_org_owner();

-- Every new user gets a personal organization. Keeps the single-user
-- path zero-config; seed_org_owner() then adds their owner membership.
create or replace function public.handle_new_user_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organizations (name, owner_id)
  values ('Personal', new.id);
  return new;
end;
$$;

create trigger on_auth_user_created_org
  after insert on auth.users
  for each row execute procedure public.handle_new_user_org();

-- ^^^ end migrations/0004_organizations.sql ^^^

-- vvv migrations/0005_feature_flags.sql vvv
-- ─────────────────────────────────────────────
-- 0005: Feature flags
-- ─────────────────────────────────────────────
-- ── FIX (vs Master Framework) ────────────────────────────────────
-- The framework declared:
--   unique(key, user_id),
--   unique(key, tier)
-- Both columns are nullable, and Postgres treats NULLs as distinct
-- in unique constraints — so unlimited (key, NULL) rows were allowed
-- and there was nothing stopping a row from targeting BOTH a user and
-- a tier at once. A flag has exactly one scope: a specific user, a
-- tier, or global. We enforce that with a CHECK + three partial
-- unique indexes (one per scope).
create table feature_flags (
  id       uuid primary key default gen_random_uuid(),
  key      text not null,
  user_id  uuid references auth.users(id) on delete cascade,
  -- Widen this CHECK when you add paid tiers (keep in sync with
  -- @ourelectedeurope/permissions `Tier` + migration 0002).
  tier     text check (tier in ('free')),
  enabled  boolean not null default true,
  constraint feature_flags_scope_chk check (
    (user_id is not null and tier is null)       -- user-scoped flag
    or (user_id is null and tier is not null)    -- tier-scoped flag
    or (user_id is null and tier is null)        -- global flag
  )
);

alter table feature_flags enable row level security;

-- One row per (key) within each scope.
create unique index feature_flags_user_key_uidx
  on feature_flags (key, user_id) where user_id is not null;
create unique index feature_flags_tier_key_uidx
  on feature_flags (key, tier)    where tier is not null;
create unique index feature_flags_global_key_uidx
  on feature_flags (key)          where user_id is null and tier is null;

-- A user may read their own flags plus tier/global flags. Feature
-- flags are not sensitive, so broad read is acceptable here.
create policy "feature_flags_read" on feature_flags
  for select using (
    user_id = auth.uid()
    or user_id is null
  );

-- ^^^ end migrations/0005_feature_flags.sql ^^^

-- vvv migrations/0006_audit_log.sql vvv
-- ─────────────────────────────────────────────
-- 0006: Audit log
-- ─────────────────────────────────────────────
create table audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references auth.users(id) on delete set null,
  action       text not null,
  resource     text,
  resource_id  text,
  metadata     jsonb default '{}',
  ip_address   inet,
  created_at   timestamptz default now()
);

alter table audit_log enable row level security;

-- Only the service-role writes (RLS-bypassing); admins read.
-- ── FIX (vs Master Framework) ────────────────────────────────────
-- Was: exists (select 1 from admin_roles where user_id = auth.uid())
-- which is always false because admin_roles denies all selects under
-- RLS. Use the SECURITY DEFINER is_admin() helper (see 0003) instead.
create policy "audit_log_admin_read" on audit_log
  for select using ( public.is_admin() );

create index audit_log_created_at_idx on audit_log (created_at desc);
create index audit_log_actor_id_idx   on audit_log (actor_id);
create index audit_log_action_idx     on audit_log (action);

-- ^^^ end migrations/0006_audit_log.sql ^^^

-- vvv migrations/0007_rate_limit_log.sql vvv
-- ─────────────────────────────────────────────
-- 0007: Rate limit log
-- ─────────────────────────────────────────────
create table rate_limit_log (
  id          uuid primary key default gen_random_uuid(),
  ip_address  inet not null,
  endpoint    text not null,
  count       integer default 1,
  window_end  timestamptz not null,
  created_at  timestamptz default now()
);

alter table rate_limit_log enable row level security;

-- ── FIX (vs Master Framework) ────────────────────────────────────
-- Same admin_roles-subquery bug as audit_log. Use is_admin() (0003).
create policy "rate_limit_admin_read" on rate_limit_log
  for select using ( public.is_admin() );

create index rate_limit_ip_idx on rate_limit_log (ip_address, window_end);

-- ^^^ end migrations/0007_rate_limit_log.sql ^^^

-- vvv migrations/0008_security_events.sql vvv
-- ─────────────────────────────────────────────
-- 0008: Security events
-- ─────────────────────────────────────────────
create table security_events (
  id          uuid primary key default gen_random_uuid(),
  event_type  text not null,
  -- Values: 'login_failure' | 'mfa_failure' | 'permission_denied' |
  --         'rate_limit_exceeded' | 'suspicious_activity' |
  --         'webhook_invalid' | 'api_key_invalid' | 'auth_failure'
  user_id     uuid references auth.users(id) on delete set null,
  ip_address  inet,
  user_agent  text,
  resource    text,
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

alter table security_events enable row level security;

-- ── FIX (vs Master Framework) ────────────────────────────────────
-- Same admin_roles-subquery bug as audit_log. Use is_admin() (0003).
create policy "security_events_admin_read" on security_events
  for select using ( public.is_admin() );

create index security_events_created_at_idx on security_events (created_at desc);
create index security_events_user_id_idx    on security_events (user_id);
create index security_events_ip_idx         on security_events (ip_address);
create index security_events_type_idx       on security_events (event_type);

-- ^^^ end migrations/0008_security_events.sql ^^^

commit;
