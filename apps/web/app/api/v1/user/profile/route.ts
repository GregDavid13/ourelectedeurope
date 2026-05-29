// REFERENCE IMPLEMENTATION of the Master Framework Flow 6 security
// pattern. Copy this ordering for every protected /api/v1 route —
// skipping a step is a bug. The outer try/catch is part of the shape:
// it turns any unexpected throw into a logged 500 instead of an opaque
// crash, so a single route bug never leaks a stack trace or dies
// silently.
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase-server'
import { can } from '@/lib/permissions'
import { writeAudit } from '@/lib/audit'
import { updateProfileSchema } from '@gregdavid13/validators'

export async function PATCH(req: NextRequest) {
  try {
    // 1. Rate limit (pre-auth IP tier)
    const limited = await checkRateLimit(req)
    if (limited) return limited

    // 2. Input validation
    const body = await req.json().catch(() => null)
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // 3. Authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 3b. Per-user rate tier (the budget that actually constrains an abuser)
    const limitedUser = await checkRateLimit(req, 'api', user.id)
    if (limitedUser) return limitedUser

    // 4. Load tier
    const { data: profile } = await supabase
      .from('user_profiles').select('tier').eq('id', user.id).single()

    // 5. Permission check (tier capability — org authority is RLS)
    if (!profile || !can(profile.tier, 'write:own_data')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 6. Business logic (RLS still enforces row ownership)
    const { data: result, error } = await supabase
      .from('user_profiles').update(parsed.data).eq('id', user.id)
      .select().single()
    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

    // 7. Audit (non-fatal — writeAudit never throws; see lib/audit.ts)
    await writeAudit({
      actorId: user.id, action: 'data.updated', resource: 'user_profiles',
      resourceId: user.id, ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json({ data: result })
  } catch (err) {
    // Last line of defense: log the real error server-side, return an
    // opaque 500 to the client. Never let an unhandled throw escape.
    console.error('[PATCH /api/v1/user/profile]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
