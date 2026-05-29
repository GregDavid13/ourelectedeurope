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
