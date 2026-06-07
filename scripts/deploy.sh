#!/usr/bin/env bash
# Build the standalone Next.js bundle and ship it to the prod box.
#
# Expects on caller env:
#   PROD_SSH_HOST   prod box hostname or IP (e.g. api.speak-up.pro)
#   PROD_SSH_USER   ssh user
#   SSH_KEY_PATH    optional path to private key; defaults to ssh agent
#   REMOTE_DIR      install dir on prod (default /opt/eventup-admin-web)
#   SERVICE_NAME    systemd unit name  (default eventup-admin-web)
#
# Runs:
#   pnpm install --frozen-lockfile
#   pnpm build      (emits .next/standalone/server.js — needs output:standalone)
#   stages public/ and .next/static/ into .next/standalone/
#   rsync .next/standalone/ -> $REMOTE_DIR
#   ssh sudo systemctl restart $SERVICE_NAME
#
# Does NOT touch /etc/eventup-admin-web/env, /etc/systemd/system/*.service,
# or nginx vhost — those are provisioned once by hand per README "Deploy".

set -euo pipefail

REMOTE_DIR=${REMOTE_DIR:-/opt/eventup-admin-web}
SERVICE_NAME=${SERVICE_NAME:-eventup-admin-web}

: "${PROD_SSH_HOST:?must set PROD_SSH_HOST}"
: "${PROD_SSH_USER:?must set PROD_SSH_USER}"

SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
if [[ -n "${SSH_KEY_PATH:-}" ]]; then
  SSH_OPTS+=(-i "$SSH_KEY_PATH")
fi

echo "==> pnpm install"
pnpm install --frozen-lockfile

echo "==> pnpm build"
pnpm build

if [[ ! -f .next/standalone/server.js ]]; then
  echo "ERROR: .next/standalone/server.js missing — next.config.ts must set output:'standalone'" >&2
  exit 1
fi

echo "==> staging public/ and .next/static/ into standalone bundle"
rm -rf .next/standalone/public .next/standalone/.next/static
mkdir -p .next/standalone/.next
cp -R public .next/standalone/public
cp -R .next/static .next/standalone/.next/static

echo "==> rsync -> ${PROD_SSH_USER}@${PROD_SSH_HOST}:${REMOTE_DIR}"
rsync -az --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  .next/standalone/ \
  "${PROD_SSH_USER}@${PROD_SSH_HOST}:${REMOTE_DIR}/"

echo "==> systemctl restart ${SERVICE_NAME}"
ssh "${SSH_OPTS[@]}" "${PROD_SSH_USER}@${PROD_SSH_HOST}" \
  "sudo systemctl restart ${SERVICE_NAME} && sudo systemctl is-active ${SERVICE_NAME}"

echo "==> deploy done"
