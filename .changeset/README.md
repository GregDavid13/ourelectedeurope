# Changesets

This folder is how a fix becomes a published version — the whole point of
the #12 extraction (`planning/decisions/2026-05-18-versioned-packages.md`).
The five extracted packages (`@gregdavid13/{crypto,permissions,validators,stripe,db}`)
are published to GitHub Packages; everything else is `private` and ignored.

## Workflow

1. After changing an extracted package, run `pnpm changeset` and pick the
   semver bump (patch / minor / major) + a one-line summary. This writes a
   markdown file here.
2. Merge the change (with its changeset) to `main`.
3. The `Release` workflow (`.github/workflows/release.yml`) opens a "Version
   Packages" PR that consumes the changesets, bumps versions, and updates
   CHANGELOGs.
4. Merging that PR publishes the new versions to GitHub Packages.

A consuming product then picks up the fix with one dependency bump
(`pnpm up @gregdavid13/permissions`) — Dependabot can raise it
automatically — instead of having the fix hand-applied per repo.

See https://github.com/changesets/changesets for the format.
