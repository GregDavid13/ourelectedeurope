// POST → mobile subscription (Flow 5): ensure customer →
// ephemeralKey → subscription(default_incomplete, expand
// latest_invoice.payment_intent) → return clientSecret +
// ephemeralKeySecret + customerId + publishableKey. Handle
// no-payment-due (SetupIntent) and idempotency. STUB.
import { NextResponse } from 'next/server'
export async function POST() {
  return NextResponse.json({ error: 'TODO: Flow 5' }, { status: 501 })
}
