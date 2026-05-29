import { describe, it, expect } from 'vitest'
import { can } from '@/lib/permissions'

// Example app-layer test. The point is the pattern (positive AND
// negative assertions), not coverage — extend it as you build.
// Tier capability only; org-role authority is enforced by RLS and
// covered by supabase/tests/0002_organizations_test.sql.
// Scaffold ships one tier: `free`. When you add a paid tier, extend
// these with its positive grants AND a negative for what it still lacks.
describe('can(tier, action)', () => {
  it('free can read and write its own data', () => {
    expect(can('free', 'read:own_data')).toBe(true)
    expect(can('free', 'write:own_data')).toBe(true)
  })

  it('free has no team/api/export capability (grant via a paid tier)', () => {
    expect(can('free', 'read:team_data')).toBe(false)
    expect(can('free', 'write:team_data')).toBe(false)
    expect(can('free', 'access:api')).toBe(false)
    expect(can('free', 'export:data')).toBe(false)
  })

  it('no tier is granted access:admin via this matrix', () => {
    expect(can('free', 'access:admin')).toBe(false)
  })
})
