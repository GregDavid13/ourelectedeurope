# 2026-05-18 Template repo + versioned packages (end copy-paste)
Status: accepted (decision) / in-repo groundwork executed 2026-05-24,
live publish pending (infra) — see Update at the bottom.

## Context
The framework's distribution model was "copy this document/repo into
a new product and find-replace `my-saas`." Every security fix made in
this engagement — the RLS corrections, the team_members escalation,
the org re-model — demonstrates the failure mode directly: a fix
applied to the framework does **not** reach any product already
shipped. It must be hand-re-applied per repo, indefinitely, and
divergence is silent. Copy-paste is the root cause behind "the bugs
would have to be hand-fixed in every repo forever."

## Options considered
1. **Template repo + versioned private packages (chosen).** A GitHub
   template repo for the disposable skeleton; security-critical code
   (`@org/db` incl. migrations, `@org/auth`, `@org/crypto`,
   `@org/permissions`, `@org/rate-limit`, `@org/stripe`) extracted to
   versioned private packages. Fix = publish a patch version;
   `dependabot` + the CI/pgTAP gate propagate and verify it.
2. **Monorepo of all products.** Fixes propagate instantly, but
   couples unrelated products' release cadence and blast radius;
   rejected.
3. **Keep copy-paste, add a CHANGELOG to diff against.** Cheap, but
   propagation stays manual and divergence stays silent; rejected.

## Decision
Adopt option 1. This ADR records the decision and the master doc's
Part 6 Step 1 / Part 9 Phase 1 were rewritten to instruct
`gh repo create --template` + pinned `@org/*` dependencies instead of
copy-paste-and-find-replace. Migrations ship inside `@org/db`,
preserving the single-source-of-truth from
[[2026-05-18-rls-policy-corrections]] (#7) across products.

**Explicitly not executed here.** Extracting the packages, standing
up a private registry / npm auth, splitting CI, and cutting the
template repo are multi-repo infrastructure work that cannot be done
by editing a document. That is a separate scheduled project; the doc
changes describe the target state, they do not implement it.

## Consequences
- **Easier:** a security fix becomes one version bump that Dependabot
  raises and CI verifies, instead of N hand-patched repos. The fixes
  from this engagement become the motivating v1 of `@org/db` /
  `@org/auth`.
- **Harder / cost:** private registry auth in every product + CI;
  package release discipline (semver, changelogs); a breaking change
  in a security package now needs a coordinated rollout.
- **Sequencing risk:** until the infra project lands, products are
  still copy-paste and do NOT inherit fixes — so this should be
  scheduled before, not after, the next product is started, or that
  product inherits the very problem this decision exists to kill.
- **Open:** package boundary cut-lines, registry choice (GitHub
  Packages vs npm private vs Verdaccio), and the template repo's
  relationship to this document (the doc becomes the package design
  reference, not the thing you copy).

## Update 2026-05-24 — in-repo extraction executed (publish still gated)
The deterministic, in-repo half of option 1 is now done in this
scaffold; only the registry side (a token + the repo on GitHub) remains.

**Open questions, now decided:**
- **Registry:** GitHub Packages.
- **Scope:** `@gregdavid13` (the repo owner — distinct from each
  product's `@<product>` scope, so `new-product.sh` never renames the
  shared packages).
- **Boundary:** the security-critical set —
  `@gregdavid13/{crypto,permissions,validators,stripe,db}`. `ui` +
  `config` stay internal (`@ourelectedeurope/*`, `private`).

**Executed:**
- Renamed those five to `@gregdavid13/*` and updated every consumer
  (apps, inter-package deps, `transpilePackages`, vitest aliases).
- Made them publishable: dropped `private`; added a CJS `build`
  (`tsconfig.build.json` → `dist/` with d.ts), `files:["dist"]`, repo/
  license, and a `publishConfig` that rewrites `main`/`types`/`exports`
  to `dist` **only on publish** — in-repo consumption stays source-based,
  so the previously-verified build is untouched.
- Changesets: `.changeset/config.json` (access restricted; apps/ui/config
  ignored), root `changeset`/`version-packages`/`release` scripts,
  `@changesets/cli` devDep.
- `.npmrc` maps `@gregdavid13` → GitHub Packages (auth left out-of-band).
- `.github/workflows/release.yml` (changesets/action with `GITHUB_TOKEN`).
- Verified headless: `pnpm typecheck` (13 tasks incl. all 5 dist builds) +
  `pnpm test` (3/3) green; `pnpm pack` confirms the artifact ships only
  `dist/*`, with dist entry points and no `private`.

**Clone-consume path — now built (2026-05-24):** `new-product.sh --thin`
produces a clone that *depends on* `@gregdavid13/*` from GitHub Packages
(removes the copied source, pins `^version`, trims `transpilePackages` +
vitest aliases, drops the publisher artifacts, writes a `dependabot.yml`).
It only *installs* once the pinned versions are actually published. Default
(no `--thin`) still carries the source, which works pre-publish.

**Still gated — the credentialed publish only (runbook:
`ops/release-packages.md`):**
- This scaffold must become a git repo on GitHub under the `@gregdavid13`
  owner, with a `write:packages` token; then the first publish (or merging a
  "Version Packages" PR) ships the versions. Cannot be done from the agent
  sandbox, and publishing is irreversible.
- Wart: the five keep a `workspace:*` devDep on the unpublished
  `@ourelectedeurope/config` (their tsconfig) — harmless (devDeps aren't installed
  by consumers) but inline or publish `config` before going fully live.
- Build is bundler-oriented CJS (consumers are Next/Expo). For raw Node
  ESM, switch to NodeNext + extensioned imports.
