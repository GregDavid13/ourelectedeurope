// Admin gate for (admin) routes. CODEOWNERS-guarded. Two accepted
// admins: SUPER_ADMIN_EMAILS env allowlist OR a row in admin_roles
// (read via service-role / is_admin()). Never trust client claims.
import 'server-only'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHORIZED')

  const superAdmins = (process.env.SUPER_ADMIN_EMAILS ?? '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  if (user.email && superAdmins.includes(user.email.toLowerCase())) {
    return { userId: user.id }
  }

  // admin_roles is deny-all under RLS — must read via service-role.
  const admin = createAdminClient()
  const { data } = await admin
    .from('admin_roles').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!data) throw new Error('FORBIDDEN')
  return { userId: user.id }
}
