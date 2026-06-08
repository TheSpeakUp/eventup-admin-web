#!/usr/bin/env bash
# Stage the Next.js standalone bundle so it's a drop-in deploy payload.
#
# Next emits `.next/standalone/server.js` + minimal node_modules but
# does NOT copy `public/` or `.next/static/` into that dir — runtime
# expects those alongside server.js. This script wires them in.
#
# Idempotent: safe to run twice.
set -euo pipefail

if [[ ! -f .next/standalone/server.js ]]; then
  echo "ERROR: .next/standalone/server.js missing — run \`pnpm build\` first" >&2
  exit 1
fi

rm -rf .next/standalone/public .next/standalone/.next/static
mkdir -p .next/standalone/.next
cp -R public .next/standalone/public
cp -R .next/static .next/standalone/.next/static

echo "==> staged .next/standalone/ — drop-in deploy payload ready"
