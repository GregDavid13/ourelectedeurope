// POST → Stripe Checkout session (web upgrade, Flow 4).
// Follow the Flow 6 ordering — see api/v1/user/profile/route.ts.
import { NextResponse } from 'next/server'
export async function POST() {
  return NextResponse.json({ error: 'TODO: implement Flow 4' }, { status: 501 })
}
