// Re-export only. Canonical RBAC lives in @gregdavid13/permissions (#12).
// Tier capability here is orthogonal to org-role authority enforced
// by RLS (is_org_admin/is_org_member) — see the package's note.
export { can, type Tier, type Action } from '@gregdavid13/permissions'
