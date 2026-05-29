// Canonical RBAC policy (#12: security code lives in a versioned
// package, not copy-pasted into each app). apps/web/lib/permissions.ts
// re-exports this — do not fork it.
//
// Two orthogonal axes — do not conflate:
//   • Tier (this file): does the user's PLAN include the capability
//     at all? Billing capability. Answered by can(tier, action).
//   • Org role (organization_members.role): WITHIN an org, may this
//     user act? Authority. Enforced in the DB by is_org_admin() /
//     is_org_member() RLS (migration 0004), NOT here.
// A correct team write needs BOTH can(tier,'write:team_data') AND the
// row-level org policy.

// Scaffold ships ONE tier: `free`. The Citizen/Advocate/Researcher
// tiers were product-specific and were removed (2026-05-23). The Action
// vocabulary below is intentionally kept complete — it's the menu of
// capabilities you grant when you add a paid tier. To add one:
//   1. extend `Tier` (e.g. 'free' | 'pro'),
//   2. add its capability list to PERMISSIONS,
//   3. add a PLANS entry + STRIPE_PRICE_* in @gregdavid13/stripe,
//   4. widen the `tier` CHECK in migrations 0002 & 0005.
export type Tier = 'free'

export type Action =
  | 'read:own_data'   | 'write:own_data'
  | 'read:team_data'  | 'write:team_data'
  | 'invite:team_members'
  | 'access:api'
  | 'export:data'
  | 'access:admin'

const PERMISSIONS: Record<Tier, Action[]> = {
  free: ['read:own_data', 'write:own_data'],
}

export function can(tier: Tier, action: Action): boolean {
  return PERMISSIONS[tier]?.includes(action) ?? false
}
