# 2026-05-18 Existing-app migration — lessons (spearheadforums trial)
Status: accepted

## Context
First trial of migrating a real, already-deployed app
(`spearheadforums`, Next 16 / React 19 / Supabase, with live users)
onto this framework's architecture. The structural conversion was the
easy part; the trial surfaced a class of risk the greenfield clone
path never encounters.

## What the trial taught
- The existing app had a **hardcoded super-admin email backdoor**
  duplicated across 7 sites (middleware, role helper, a client
  component, 3 admin API routes, and the SQL seed), plus **fail-open**
  role resolution (granted a role when the profiles query failed). A
  naive "move files into the new structure" would have faithfully
  preserved both — making the restructured app *look* hardened while
  still being backdoored.
- Real PII (a personal email) was embedded in source and in git
  history. Cleaning the working tree does not clean history.
- The app ran newer framework versions than the reference
  (Next 16/React 19 vs 15/18) — adopting reference code verbatim
  would have downgraded a working app.

## Decision
Migration is now a first-class, distinct path with a mandatory
**Phase 0 pre-flight security scan** before any restructuring:
hardcoded identity backdoors, fail-open auth, secrets/PII in source
*and* history, privileged-route authz ordering. Codified as
**Master Framework Part 12** and summarized in this scaffold's
`CLAUDE.md` ("Migrating an EXISTING app").

Corollaries: adopt the framework's *conventions*, keep the app's own
domain schema; reconcile versions upward (don't downgrade), re-verify;
data/auth migration is a planned, staged ADR — never auto-applied
against a live DB.

## Consequences
- The framework now has explicit migration guidance, not just a
  clone path. Future migrations start with the security scan.
- Open/inherent: git-history PII scrubbing remains a separate
  destructive decision the framework deliberately does not automate.
- Trial artifacts live in the `spearheadforums` repo
  (`adopt-framework` branch / PR), not here; this scaffold only
  carries the reusable lesson.
