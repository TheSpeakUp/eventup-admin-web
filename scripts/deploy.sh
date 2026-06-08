#!/usr/bin/env bash
# Deploy a pre-built Next.js standalone bundle to the prod origin box.
#
# Designed for CI: assumes the bundle has already been built + staged
# (see scripts/stage-standalone.sh). Does NOT run pnpm install or build —
# CI does that in a separate job + uploads the artifact.
#
# Required env:
#   PROD_SSH_HOST   prod box hostname or IP (e.g. 13.203.173.33)
#   PROD_SSH_USER   ssh user (sudoer for systemctl restart)
#   BUNDLE_DIR      local dir containing the staged standalone bundle
#                   (defaults to .next/standalone)
# Optional env:
#   SSH_KEY_PATH    path to private key; if empty, defaults to ssh agent
#   REMOTE_DIR      install dir on prod (default /opt/eventup-admin-web)
#   SERVICE_NAME    systemd unit name  (default eventup-admin-web)
#   SMOKE_HOST      external Host header for the post-deploy smoke probe
#                   (default admin-marketplace.speakup.ltd)
#
# Behaviour:
#   1. rsync $BUNDLE_DIR/ → $PROD_SSH_USER@$PROD_SSH_HOST:$REMOTE_DIR/
#      (--delete, scoped strictly to REMOTE_DIR — safe vs sibling apps)
#   2. ssh sudo systemctl restart $SERVICE_NAME
#   3. ssh sudo systemctl is-active $SERVICE_NAME (assert running)
#   4. curl https://$SMOKE_HOST/login through Cloudflare; assert HTTP 200
set -euo pipefail

REMOTE_DIR=${REMOTE_DIR:-/opt/eventup-admin-web}
SERVICE_NAME=${SERVICE_NAME:-eventup-admin-web}
BUNDLE_DIR=${BUNDLE_DIR:-.next/standalone}
SMOKE_HOST=${SMOKE_HOST:-admin-marketplace.speakup.ltd}

: "${PROD_SSH_HOST:?must set PROD_SSH_HOST}"
: "${PROD_SSH_USER:?must set PROD_SSH_USER}"

if [[ ! -d $BUNDLE_DIR ]]; then
  echo "ERROR: $BUNDLE_DIR missing — build artifact must be downloaded first" >&2
  exit 1
fi

SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/dev/null)
if [[ -n "${SSH_KEY_PATH:-}" ]]; then
  SSH_OPTS+=(-i "$SSH_KEY_PATH")
fi

echo "==> rsync $BUNDLE_DIR/ -> $PROD_SSH_USER@$PROD_SSH_HOST:$REMOTE_DIR"
rsync -az --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  "$BUNDLE_DIR/" \
  "$PROD_SSH_USER@$PROD_SSH_HOST:$REMOTE_DIR/"

echo "==> systemctl restart $SERVICE_NAME"
ssh "${SSH_OPTS[@]}" "$PROD_SSH_USER@$PROD_SSH_HOST" \
  "sudo systemctl restart $SERVICE_NAME && sudo systemctl is-active $SERVICE_NAME"

echo "==> smoke https://$SMOKE_HOST/login"
# Allow a few seconds for the new process to bind :3001 and CF cache to warm.
for i in 1 2 3 4 5; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "https://$SMOKE_HOST/login" || echo "000")
  if [[ "$code" == "200" ]]; then
    echo "==> smoke OK ($code)"
    exit 0
  fi
  echo "smoke attempt $i returned $code — retrying in 3s"
  sleep 3
done
echo "ERROR: smoke probe never returned 200" >&2
exit 1
