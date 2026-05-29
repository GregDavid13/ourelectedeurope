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
