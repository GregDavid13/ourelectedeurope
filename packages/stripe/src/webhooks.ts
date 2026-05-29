// Type-safe Stripe event handlers. STUB — implement per Master
// Framework Flow 4 steps 10–14 and the #11 idempotency note:
//   • verify signature (constructEvent) BEFORE anything else
//   • derive desired state from the subscription object and UPSERT
//     (idempotent — replays/out-of-order must converge)
//   • handle created|updated|deleted + invoice.payment_failed
//   • writeAudit('billing.*'); never trust the client success callback
import type Stripe from 'stripe'

export async function handleStripeEvent(_event: Stripe.Event): Promise<void> {
  throw new Error('TODO: implement webhook handlers — Master Framework Flow 4')
}
