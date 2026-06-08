#!/usr/bin/env bash
# Stage the Next.js standalone bundle so it's a drop-in deploy payload.
#
# Next emits `.next/standalone/server.js` + minimal node_modules but does
# NOT copy `public/` or `.next/static/` into that dir — runtime expects
# them alongside server.js. This script wires them in.
#
# It also patches a well-known pnpm + Next-standalone gap: dependencies
# that pnpm parks under `.pnpm/<hash>/node_modules/<scope>/<name>/` never
# get surfaced to top-level `node_modules/<scope>/<name>/`, so the bundle
# only has `next`, `react`, `react-dom` at top-level and `node server.js`
# dies with `Cannot find module '@swc/helpers/...'` / `Cannot find module
# '@next/env'` on prod boot (no parent node_modules to fall back to).
#
# Fix: copy every package found at `.pnpm/<any>/node_modules/<scope>/<name>/`
# up to `node_modules/<scope>/<name>/`. Matches what a flat npm/yarn
# install would produce.
#
# Idempotent: safe to run twice.
set -euo pipefail

if [[ ! -f .next/standalone/server.js ]]; then
  echo "ERROR: .next/standalone/server.js missing — run \`pnpm build\` first" >&2
  exit 1
fi

# 1) public/ + .next/static/ → bundle (next does not copy these itself)
rm -rf .next/standalone/public .next/standalone/.next/static
mkdir -p .next/standalone/.next
cp -R public .next/standalone/public
cp -R .next/static .next/standalone/.next/static

# 2) Hoist pnpm-only deps to top-level node_modules of the bundle.
STAGED=.next/standalone/node_modules
PNPM_STORE=$STAGED/.pnpm

hoist_one() {
  local src=$1 dest=$2
  [[ -e $dest ]] && return 0  # already at top-level, skip
  mkdir -p "$(dirname "$dest")"
  cp -R "$src" "$dest"
  echo "==> hoisted ${dest#$STAGED/}"
}

if [[ -d $PNPM_STORE ]]; then
  # Scoped packages: .pnpm/<hash>/node_modules/@scope/name → @scope/name
  # Greedy `##` strips up to the LAST `/node_modules/` so dest is the
  # top-level relative path, not the pnpm-store-relative one.
  while IFS= read -r -d '' src; do
    rel=${src##*/node_modules/}                   # @scope/name
    hoist_one "$src" "$STAGED/$rel"
  done < <(find "$PNPM_STORE" -mindepth 4 -maxdepth 4 -type d \
            -path "*/node_modules/@*/*" -print0 2>/dev/null)

  # Unscoped packages: .pnpm/<hash>/node_modules/name → name
  while IFS= read -r -d '' src; do
    rel=${src##*/node_modules/}                   # name
    [[ $rel == @* ]] && continue                  # scoped handled above
    [[ $rel == .* ]] && continue                  # skip .bin, .modules.yaml, etc
    hoist_one "$src" "$STAGED/$rel"
  done < <(find "$PNPM_STORE" -mindepth 3 -maxdepth 3 -type d \
            -path "*/node_modules/*" -not -path "*/node_modules/@*" -print0 2>/dev/null)
fi

echo "==> staged .next/standalone/ — drop-in deploy payload ready"
