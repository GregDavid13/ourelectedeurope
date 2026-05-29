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
