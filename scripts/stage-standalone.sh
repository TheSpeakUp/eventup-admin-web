#!/usr/bin/env bash
# Stage the Next.js standalone bundle so it's a drop-in deploy payload.
#
# Next emits `.next/standalone/server.js` + minimal node_modules but does
# NOT copy `public/` or `.next/static/` into that dir — runtime expects
# them alongside server.js. This script wires them in.
#
# It also patches a well-known pnpm + Next-standalone issue: helpers that
# pnpm parks under `.pnpm/<hash>/node_modules/@swc/helpers/` never get
# surfaced to top-level `node_modules/@swc/helpers/`, so `node server.js`
# inside the bundle dies with `Cannot find module
# '@swc/helpers/_/_interop_require_default'` on prod boot (no parent
# node_modules to fall back to). We copy the helpers up explicitly.
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
#
# The standalone bundle's node_modules layout looks like this after
# `next build`:
#
#   .next/standalone/node_modules/next
#   .next/standalone/node_modules/react
#   .next/standalone/node_modules/react-dom
#   .next/standalone/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/...
#
# Node's resolution from `node_modules/next/dist/shared/lib/constants.js`
# walks up looking for `node_modules/@swc/helpers/` — finds nothing,
# crash. Copying the helpers to the top-level matches what Next standalone
# would produce under a flat npm/yarn install.
STAGED=.next/standalone/node_modules
PNPM_STORE=$STAGED/.pnpm
if [[ -d $PNPM_STORE ]]; then
  while IFS= read -r src; do
    name=$(basename "$src")
    dest="$STAGED/@swc/$name"
    [[ -e $dest ]] && continue
    mkdir -p "$STAGED/@swc"
    cp -R "$src" "$dest"
    echo "==> hoisted node_modules/@swc/$name from .pnpm"
  done < <(find "$PNPM_STORE" -maxdepth 4 -type d -path "*node_modules/@swc/*" \
            -not -path "*node_modules/@swc" 2>/dev/null | sort -u)
fi

echo "==> staged .next/standalone/ — drop-in deploy payload ready"
