// Weekly cron. Validates CRON_SECRET before running (never run the job on
// an invalid secret). Uses service-role (bypasses RLS) for
// system-level work. weekly aggregates
import { NextRequest, NextResponse } from 'next/server'
export async function GET(req: NextRequest) {
  // CRON_SECRET is optional at boot (lib/env.ts) — but an UNSET secret
  // must fail CLOSED, never open. `Bearer undefined` would otherwise
  // match an unset secret and let anyone trigger the job.
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron/weekly] CRON_SECRET is not set — refusing to run')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // TODO: weekly aggregates
  return NextResponse.json({ success: true })
}
