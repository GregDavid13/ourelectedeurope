#!/usr/bin/env bash
#
# new-product.sh — mint a fresh product from the my-app scaffold.
#
# Automates the 7 clone steps documented in CLAUDE.md so they cost zero
# Claude tokens and run in seconds instead of an interactive session.
# The scaffold this script lives in is the SOURCE and is NEVER modified:
# every run copies it to a new directory and rewrites the new copy's
# identity in place. Rinse and repeat — one invocation per product.
#
# Usage:
#   scripts/new-product.sh <product-name> [options]
#
#   <product-name>   lowercase; letters, digits, hyphens; starts with a
#                    letter. Valid as an npm scope (@<name>/*) AND a
#                    Supabase project_id.
#
# Options:
#   --dest <dir>     Destination directory (default: ../<product-name>)
#   --owner <gh>     GitHub handle for .github/CODEOWNERS (omit the @)
#   --install        Run `pnpm install` after scaffolding
#   --db             supabase db start + test db + regen DB types
#                    (requires Docker + the Supabase CLI)
#   --git            git init + an initial commit in the new product
#   --thin           #12 mode: DEPEND on the shared @gregdavid13/*
#                    security packages from GitHub Packages instead of
#                    carrying their source. Requires those versions to be
#                    PUBLISHED (otherwise install can't resolve them).
#   -h, --help       Show this help and exit
#
# Steps (✓ = always, ▸ = flag-gated):
#   1 ✓ copy scaffold → <dest>     (excludes node_modules/.git/build/.env)
#   2 ✓ rename @ourelectedeurope/* → @<name>/*, root pkg name, Supabase project_id,
#       mobile app identifiers (name/slug/scheme/bundle id), web <title>
#   3 ▸ pnpm install                              (--install)
#   4 ▸ supabase db start && supabase test db      (--db)
#   5 ▸ supabase gen types … > packages/db/src/database.types.ts (--db)
#   6 ✓ create apps/web/.env from .env.example     (you fill the values)
#   7 ✓ set the CODEOWNERS reviewer                (--owner, else TODO)
#
# What it intentionally does NOT touch:
#   • The shared @gregdavid13/* security packages (#12) — only the
#     per-product @ourelectedeurope/* scope is rewritten, so the versioned packages
#     keep their identity. By default they're carried as copied source
#     (works pre-publish); pass --thin to depend on the published versions
#     instead (see the versioned-packages ADR + ops/release-packages.md).
#   • Prose in CLAUDE.md / SCAFFOLD-NOTES.md / planning that refers to
#     "my-app" as the scaffold lineage — review those yourself.

set -euo pipefail

# ── helpers ──────────────────────────────────────────────────────────
say()  { printf '\033[1;34m▸\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m✓\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

# Print the header comment block (everything up to `set -euo pipefail`).
usage() { sed -n '2,/^set -euo pipefail/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

# ── parse args ───────────────────────────────────────────────────────
PRODUCT=""
DEST=""
OWNER=""
DO_INSTALL=0
DO_DB=0
DO_GIT=0
DO_THIN=0

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage 0 ;;
    --dest)    DEST="${2:-}"; shift 2 ;;
    --owner)   OWNER="${2:-}"; shift 2 ;;
    --install) DO_INSTALL=1; shift ;;
    --db)      DO_DB=1; shift ;;
    --git)     DO_GIT=1; shift ;;
    --thin)    DO_THIN=1; shift ;;
    -*)        die "unknown option: $1 (try --help)" ;;
    *)
      [ -z "$PRODUCT" ] || die "unexpected argument: $1"
      PRODUCT="$1"; shift ;;
  esac
done

[ -n "$PRODUCT" ] || { warn "missing <product-name>"; usage 1; }

# Validate name: lowercase, starts with a letter, letters/digits/hyphens.
case "$PRODUCT" in
  [a-z]*) : ;;
  *) die "name must start with a lowercase letter: '$PRODUCT'" ;;
esac
printf '%s' "$PRODUCT" | LC_ALL=C grep -Eq '^[a-z][a-z0-9-]*$' \
  || die "name may contain only lowercase letters, digits, hyphens: '$PRODUCT'"

# Defaults derived from the name.
OWNER="${OWNER:-${GITHUB_OWNER:-}}"            # flag → env → empty
APPID="$(printf '%s' "$PRODUCT" | tr -d '-')"  # hyphens illegal in app ids
SCHEME="$APPID"
BUNDLE="com.${APPID}.app"

# Resolve the scaffold root (parent of this script's dir).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCAFFOLD_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Destination (default: sibling of the scaffold).
DEST="${DEST:-$(dirname "$SCAFFOLD_ROOT")/$PRODUCT}"

# Guard: don't clobber a non-empty destination.
if [ -e "$DEST" ] && [ -n "$(ls -A "$DEST" 2>/dev/null || true)" ]; then
  die "destination already exists and is not empty: $DEST"
fi
mkdir -p "$DEST"
DEST="$(cd "$DEST" && pwd)"                     # normalize to absolute
[ "$DEST" != "$SCAFFOLD_ROOT" ] || die "destination must differ from the scaffold itself"

export PRODUCT OWNER APPID SCHEME BUNDLE

say "Scaffold : $SCAFFOLD_ROOT"
say "Product  : $PRODUCT  (scope @$PRODUCT, app id $BUNDLE)"
say "Dest     : $DEST"
echo

# ── step 1: copy scaffold → dest (clean) ─────────────────────────────
say "1/7  Copying scaffold (excluding node_modules/.git/build/.env)…"
EXCLUDES=(.git node_modules .next .turbo dist build coverage
          '*.log' .DS_Store '.env' '.env.local' 'apps/web/.env'
          'apps/web/.env.local')
if command -v rsync >/dev/null 2>&1; then
  rsync_args=(-a)
  for e in "${EXCLUDES[@]}"; do rsync_args+=(--exclude "$e"); done
  rsync "${rsync_args[@]}" "$SCAFFOLD_ROOT"/ "$DEST"/
else
  warn "rsync not found — falling back to cp + prune"
  cp -R "$SCAFFOLD_ROOT"/. "$DEST"/
  ( cd "$DEST" && rm -rf .git node_modules .next .turbo dist build coverage \
      .DS_Store .env .env.local apps/web/.env apps/web/.env.local )
  find "$DEST" -name '*.log' -type f -delete 2>/dev/null || true
  find "$DEST" -name '.DS_Store' -type f -delete 2>/dev/null || true
fi
ok "copied"

# ── step 2: rewrite identity ─────────────────────────────────────────
say "2/7  Rewriting identity (@my-app → @$PRODUCT, project_id, app ids)…"

# 2a. The npm scope, everywhere it appears (package.json, imports,
#     tsconfig paths, next.config transpilePackages, …). '@' is escaped
#     so Perl doesn't treat it as an array sigil; {} delimiters avoid
#     escaping the slash.
scope_files="$(grep -rlI --exclude-dir=.git -- '@ourelectedeurope/' "$DEST" 2>/dev/null || true)"
if [ -n "$scope_files" ]; then
  printf '%s\n' "$scope_files" | while IFS= read -r f; do
    [ -n "$f" ] && perl -pi -e 's{\@ourelectedeurope/}{\@$ENV{PRODUCT}/}g' "$f"
  done
fi

# 2b. Root package.json "name" (the only unscoped my-app name there).
perl -pi -e 's{"name": "my-app"}{"name": "$ENV{PRODUCT}"}' "$DEST/package.json"

# 2c. Supabase project_id.
perl -pi -e 's{project_id = "my-app"}{project_id = "$ENV{PRODUCT}"}' \
  "$DEST/supabase/config.toml"

# 2d. Mobile app identifiers (name/slug/scheme + reverse-DNS bundle ids).
perl -pi -e '
  s{"name": "my-app"}{"name": "$ENV{PRODUCT}"};
  s{"slug": "my-app"}{"slug": "$ENV{PRODUCT}"};
  s{"scheme": "myapp"}{"scheme": "$ENV{SCHEME}"};
  s{com\.yourorg\.myapp}{$ENV{BUNDLE}}g;
' "$DEST/apps/mobile/app.json"

# 2e. Web document <title>.
perl -pi -e "s{title: 'my-app'}{title: '\$ENV{PRODUCT}'}" \
  "$DEST/apps/web/app/layout.tsx"
ok "identity rewritten"

# ── #12 thin mode (flag-gated): consume the shared security packages from
#    GitHub Packages instead of carrying their source. REQUIRES those
#    versions to be PUBLISHED — otherwise `pnpm install` can't resolve
#    them. Default (no --thin) keeps the copied source, which works today.
if [ "$DO_THIN" -eq 1 ]; then
  say "#12  Thin mode: depending on @gregdavid13/* from GitHub Packages…"
  for name in crypto permissions validators stripe db; do
    pkg="$DEST/packages/$name/package.json"
    [ -f "$pkg" ] || { warn "packages/$name missing — skipping"; continue; }
    ver="$(perl -ne 'print $1 and exit if /"version":\s*"([^"]+)"/' "$pkg")"
    ver="${ver:-0.1.0}"
    # workspace:* → ^<version> in every consumer package.json that has it
    NAME="$name" VER="$ver" perl -pi -e \
      's{("\@gregdavid13/$ENV{NAME}":\s*)"workspace:\*"}{$1"^$ENV{VER}"}g' \
      "$DEST/apps/web/package.json" "$DEST/apps/mobile/package.json"
    rm -rf "$DEST/packages/$name"
  done
  # Published packages ship prebuilt CJS in node_modules — Next doesn't
  # transpile them. Reduce transpilePackages to the one workspace package
  # the clone still carries (@<product>/ui).
  UI_PKG="@$PRODUCT/ui" perl -0pi -e \
    's{transpilePackages:\s*\[[^\]]*\]}{transpilePackages: ["$ENV{UI_PKG}"]}s' \
    "$DEST/apps/web/next.config.js"
  # Drop the source-path vitest aliases for the now-removed packages
  # (only the four extracted ones are aliased there).
  perl -ni -e 'print unless m{\@gregdavid13/}' "$DEST/apps/web/vitest.config.ts"
  # A consumer is NOT the publisher of the shared packages.
  rm -rf "$DEST/.changeset" "$DEST/.github/workflows/release.yml"
  # Dependabot raises the shared-package bumps so published fixes propagate.
  cat > "$DEST/.github/dependabot.yml" <<'YAML'
version: 2
registries:
  github-packages:
    type: npm-registry
    url: https://npm.pkg.github.com
    token: ${{secrets.PACKAGES_READ_TOKEN}}
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
    registries:
      - github-packages
    allow:
      - dependency-name: "@gregdavid13/*"
YAML
  ok "thin: @gregdavid13/* are now registry deps (must be PUBLISHED to install)"
fi

# ── step 7 (done early, it's deterministic): CODEOWNERS reviewer ─────
say "7/7  Setting CODEOWNERS reviewer…"
if [ -n "$OWNER" ]; then
  perl -pi -e 's{\@your-github-username}{\@$ENV{OWNER}}g' "$DEST/.github/CODEOWNERS"
  ok "CODEOWNERS → @$OWNER"
else
  warn "no --owner given; .github/CODEOWNERS still says @your-github-username (edit it)"
fi

# ── step 6: env file in the location Next actually reads ─────────────
say "6/7  Creating apps/web/.env from .env.example…"
if [ -f "$DEST/apps/web/.env" ]; then
  warn "apps/web/.env already exists — left untouched"
elif [ -f "$DEST/.env.example" ]; then
  cp "$DEST/.env.example" "$DEST/apps/web/.env"
  ok "apps/web/.env created (fill in the REQUIRED Supabase vars)"
else
  warn ".env.example not found — skipped"
fi

# ── step 3: install (flag-gated) ─────────────────────────────────────
if [ "$DO_INSTALL" -eq 1 ]; then
  say "3/7  pnpm install…"
  if command -v corepack >/dev/null 2>&1; then
    ( cd "$DEST" && corepack pnpm install )
    ok "dependencies installed"
  else
    warn "corepack not found — run 'corepack pnpm install' in $DEST yourself"
  fi
else
  say "3/7  pnpm install — skipped (pass --install)"
fi

# ── steps 4 & 5: database (flag-gated; needs Docker + Supabase CLI) ──
if [ "$DO_DB" -eq 1 ]; then
  if command -v supabase >/dev/null 2>&1; then
    say "4/7  supabase db start && supabase test db…"
    ( cd "$DEST" && supabase db start && supabase test db )
    ok "pgTAP green"
    say "5/7  Regenerating DB types…"
    ( cd "$DEST" && supabase gen types typescript --local \
        > packages/db/src/database.types.ts )
    ok "packages/db/src/database.types.ts regenerated"
  else
    warn "supabase CLI not found — skipped steps 4 & 5"
  fi
else
  say "4/7  supabase db start + test db — skipped (pass --db)"
  say "5/7  supabase gen types        — skipped (pass --db)"
fi

# ── optional: fresh git history ──────────────────────────────────────
if [ "$DO_GIT" -eq 1 ]; then
  if command -v git >/dev/null 2>&1; then
    ( cd "$DEST" && git init -q && git add -A \
        && git commit -qm "chore: scaffold $PRODUCT from my-app template" )
    ok "git initialized with an initial commit"
  else
    warn "git not found — skipped"
  fi
fi

# ── summary ──────────────────────────────────────────────────────────
echo
ok "Created $PRODUCT at $DEST"
echo
echo "Next steps (anything not run above):"
[ "$DO_INSTALL" -eq 1 ] || echo "  • corepack pnpm install"
[ "$DO_DB" -eq 1 ]      || echo "  • supabase db start && supabase test db   # validate the DB"
[ "$DO_DB" -eq 1 ]      || echo "  • supabase gen types typescript --local > packages/db/src/database.types.ts"
echo "  • fill apps/web/.env  (REQUIRED: the two NEXT_PUBLIC_SUPABASE_* vars)"
[ -n "$OWNER" ]         || echo "  • set the reviewer in .github/CODEOWNERS"
echo "  • SKIP_ENV_VALIDATION=1 corepack pnpm --filter @$PRODUCT/web dev"
echo "  • review CLAUDE.md / SCAFFOLD-NOTES.md (still describe the 'my-app' scaffold)"
if [ "$DO_THIN" -eq 1 ]; then
  echo "  • THIN: @gregdavid13/* are registry deps — install needs them"
  echo "    PUBLISHED + a read:packages token (export NODE_AUTH_TOKEN or"
  echo "    ~/.npmrc). See ops/release-packages.md."
else
  echo "  • @gregdavid13/* are SHARED (#12), carried as source here — once"
  echo "    published, re-clone with --thin to depend on the registry instead"
fi
