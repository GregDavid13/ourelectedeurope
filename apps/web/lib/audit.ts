import { createAdminClient } from '@/lib/supabase-admin'

export type AuditAction =
  | 'user.login' | 'user.logout' | 'user.register' | 'user.password_reset'
  | 'billing.subscription_created' | 'billing.subscription_cancelled'
  | 'billing.tier_changed' | 'billing.tier_reconciled'
  | 'admin.user_tier_override' | 'admin.user_suspended'
  | 'org.member_invited' | 'org.member_removed' | 'org.created'
  | 'api_key.created' | 'api_key.revoked'
  | 'data.exported' | 'data.updated' | 'data.deleted'
  | 'cron.daily' | 'cron.weekly'

export async function writeAudit(params: {
  actorId:     string | null
  action:      AuditAction
  resource?:   string
  resourceId?: string
  metadata?:   Record<string, unknown>
  ip?:         string
}) {
  // Audit is best-effort: it must NEVER throw back into the caller. A
  // failed audit write (or a missing service-role key) must not turn a
  // successful operation into a 500 — so the whole body is guarded and
  // failures are logged, not propagated.
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('audit_log').insert({
      actor_id:    params.actorId,
      action:      params.action,
      resource:    params.resource,
      resource_id: params.resourceId,
      metadata:    params.metadata ?? {},
      ip_address:  params.ip,
    })
    if (error) console.error('[audit]', error.message)
  } catch (err) {
    console.error('[audit] failed to write audit log:', err)
  }
}
