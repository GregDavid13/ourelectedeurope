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
