# Ops Workspace
> Scaffold template — fill in per product. Structure of record is the
> SaaS Master Framework (see /CLAUDE.md and /SCAFFOLD-NOTES.md).

## What happens here
This workspace covers everything after the code is written — deploying it, monitoring it, and operating it. When Claude is in this workspace, it is helping with infrastructure, deployment pipelines, scripts, or incident response.

## Infrastructure overview
- Hosting: [Where does the app run? e.g. Vercel, Railway, AWS EC2]
- Database: [Where is the DB hosted? e.g. Supabase, PlanetScale, RDS]
- Storage: [e.g. S3, Cloudflare R2, Supabase Storage]
- CI/CD: [e.g. GitHub Actions, CircleCI, manual deploy]

## Deploy process
1. [Step 1 — e.g. "Merge PR to main triggers GitHub Action"]
2. [Step 2 — e.g. "Tests run automatically — deploy blocked if failing"]
3. [Step 3 — e.g. "Vercel auto-deploys on passing tests"]

## Environment variables
- [VAR_NAME] — [What it does and where to get it]
- [VAR_NAME] — [What it does and where to get it]

## Runbook conventions
- [e.g. "All runbooks start with a symptoms section before steps"]
- [e.g. "Scripts must be idempotent — safe to run twice"]
- [e.g. "Never run migration scripts without a DB backup confirmed"]

## Folder guide
- /deploy — Deployment configs, Dockerfiles, CI/CD workflow files
- /monitoring — Alerts, dashboards, uptime check configs
- /scripts — One-off and recurring operational scripts
