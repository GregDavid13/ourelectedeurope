// Stripe webhook. UNVERSIONED (caller is Stripe). MUST verify the
// stripe-signature with constructEvent BEFORE anything else, then
// idempotently upsert state (Flow 4 steps 10–14 + #11). STUB.
import { NextResponse } from 'next/server'
export async function POST() {
  return NextResponse.json({ error: 'TODO: verify sig + handle event' }, { status: 501 })
}
