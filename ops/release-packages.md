# Go live: publishing the @gregdavid13/* packages (#12)

The in-repo half of #12 is done (see
`planning/decisions/2026-05-18-versioned-packages.md` → Update 2026-05-24):
the five security packages build to `dist/`, are publish-ready, and
Changesets + the release workflow are wired. This runbook is the part that
needs **your** GitHub account + a token — it can't be done from the agent
sandbox, and publishing is irreversible (GitHub Packages versions are
immutable; you can't republish a version number).

Extracted, published packages:
`@gregdavid13/{crypto,permissions,validators,stripe,db}`.

## 0. Prerequisites (one time)

1. This scaffold must be a **GitHub repo owned by `GregDavid13`** (the
   package scope must match the repo owner for GitHub Packages). If the
   `repository.url` in the package.json files differs from where you push,
   update it (it's `https://github.com/GregDavid13/my-app`).
2. From the repo root, if it isn't a git repo yet:
   ```bash
   git init && git add -A && git commit -m "scaffold + #12 groundwork"
   gh repo create GregDavid13/my-app --private --source=. --push
   ```
   (Or create the repo in the UI and `git remote add origin …; git push`.)

## 1. First publish

Two paths — pick one.

### A. Via CI (recommended — the wired path, no local token)
Pushing to `main` runs `.github/workflows/release.yml`. The changesets
action publishes whenever there are **no** pending changeset files — which
is exactly the first-push state — so it publishes the current `0.1.0` for all
five packages, and owns every release after. The built-in `GITHUB_TOKEN`
already has `packages: write`; no secret to add.

### B. Manually, from your machine (fallback)
The committed `.npmrc` maps the scope but holds NO token (so pnpm doesn't warn
locally), and pnpm reads auth from `.npmrc`, not from `$NODE_AUTH_TOKEN`. So
put a token in your USER `~/.npmrc` (never the repo's):
```bash
# classic PAT with write:packages — written to ~/.npmrc, not committed:
npm config set //npm.pkg.github.com/:_authToken ghp_xxx
corepack pnpm install --frozen-lockfile
corepack pnpm run release        # = turbo build @gregdavid13/* && changeset publish
```
`changeset publish` runs `pnpm publish` per package; `publishConfig` rewrites
the entry points to `dist/` and ships only `dist` (verified via `pnpm pack`).

## 2. Every release after the first (the steady-state loop)

1. Make a change to an extracted package.
2. `corepack pnpm changeset` → pick patch/minor/major + a summary.
3. Merge the change (with its changeset) to `main`.
4. The Release workflow opens a **"Version Packages" PR** (bumps versions +
   CHANGELOGs). Merging that PR publishes the new versions. Done — the fix is
   now one bump away for every consumer, instead of hand-patched per repo.

## 3. Consuming the packages in products (thin clones)

- Create the product with `scripts/new-product.sh <name> --thin` — it depends
  on `@gregdavid13/*` from GitHub Packages (instead of copying the source)
  and drops a `.github/dependabot.yml` that auto-raises the bumps.
- That clone needs read auth to install:
  - **local:** `~/.npmrc` →  `//npm.pkg.github.com/:_authToken=<PAT-with-read:packages>`
  - **CI:** `actions/setup-node` with `registry-url`, `NODE_AUTH_TOKEN` from a secret
  - **Dependabot:** set repo secret `PACKAGES_READ_TOKEN` (the dependabot.yml references it)
- `--thin` installs ONLY work once the versions it pins actually exist on the
  registry — publish first (steps 1–2), then clone thin.

## Known warts to clear before relying on it (from the ADR)

- The five keep a `workspace:*` devDep on the unpublished `@ourelectedeurope/config`
  (their tsconfig). Harmless (consumers don't install devDeps), but inline the
  tsconfig or publish `config` before going fully live.
- Build output is bundler-oriented CJS (consumers are Next/Expo). For raw Node
  ESM consumption, switch the packages to NodeNext + extensioned imports.
- The first publish ships `0.1.0` as-is; everything after must go through a
  changeset (the steady-state loop above) or it won't bump.
