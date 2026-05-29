# Security Policy

## Reporting a Vulnerability
Email **security@yourdomain.com**. Do not open a public issue for
security reports. We aim to acknowledge within 48 hours.

## Scope
This repository and the deployed application at yourdomain.com.

## Hardening baseline (do not regress)
- RLS on every table; admin reads gated via `public.is_admin()`
  (SECURITY DEFINER) — never an inline `admin_roles` subquery.
- Membership writes gated to org owner/admin; no self-add path.
- CSP is nonce-based (no `script-src 'unsafe-inline'`).
- Rate limiting keyed on user+IP, IP only for unauthenticated.
- `supabase test db` (pgTAP) and `pnpm turbo run test` (app units)
  are required CI checks (`ci / db-test`, `ci / test`).

See `planning/decisions/` for the rationale behind each.
