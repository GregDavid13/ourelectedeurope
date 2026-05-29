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
