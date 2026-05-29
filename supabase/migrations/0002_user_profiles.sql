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
