// Tier definitions + price IDs. Source of truth for "what does each
// plan include" on the billing side. Permission capability lives in
// @gregdavid13/permissions (orthogonal — see that package's note).
//
// The scaffold ships NO paid tiers (the Citizen/Advocate/Researcher
// plans were product-specific and were removed 2026-05-23). PLANS is
// empty and resolveTier therefore always returns 'free'. To add a paid
// tier: extend `Tier` in @gregdavid13/permissions, add an entry here keyed
// by the tier name, and add the matching STRIPE_PRICE_* env var.
import type { Tier } from '@gregdavid13/permissions'

type PlanDef = { priceIdEnv: string; label: string }

// Keyed by tier name (string so it stays valid while `Tier` is just
// 'free'). Add entries as you introduce paid tiers, e.g.
//   pro: { priceIdEnv: 'STRIPE_PRICE_PRO', label: 'Pro' }
export const PLANS: Record<string, PlanDef> = {}

// Map a Stripe subscription (status + price id) back to a tier.
// Used by the webhook AND the reconciliation cron (#11 — Stripe is
// the source of truth; user_profiles.tier is a cache).
export function resolveTier(status: string | undefined, priceId: string | undefined): Tier {
  if (status !== 'active' && status !== 'trialing') return 'free'
  for (const [tier, def] of Object.entries(PLANS)) {
    if (priceId && process.env[def.priceIdEnv] === priceId) return tier as Tier
  }
  return 'free'
}
