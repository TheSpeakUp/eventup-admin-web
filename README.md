# eventup-admin-web

Next.js 16 admin SPA for the EventUp marketplace moderation surface.
Served from `https://admin-marketplace.speakup.ltd`; talks to the
EventUp backend at `https://api.speak-up.pro/eventup-admin/v1/marketplace/*`.

## Local dev

```bash
pnpm install
pnpm dev   # → http://localhost:3000
```

With `NEXT_PUBLIC_USE_MOCK_AUTH=true NEXT_PUBLIC_USE_MOCK_BACKEND=true`
the SPA runs standalone — login as `admin@example.com / password`, msw
serves a fake `/eventup-admin/v1/marketplace/*`. See `.env.example`.

## CI + e2e

`.github/workflows/ci.yml` runs lint + build + Playwright on PRs.
`pnpm test:e2e` boots a production build on `:3100` with both mock flags
on, then drives 30 specs in headless Chromium.

## Deploy

**Auto.** Every push to `main` triggers `.github/workflows/deploy.yml`,
which:

1. **build** job (`ubuntu-latest`): `pnpm install --frozen-lockfile` →
   `pnpm build` (Next 16, `output: "standalone"`) → stage `public/` +
   `.next/static/` into `.next/standalone/` → upload as artifact
   `eventup-admin-web-standalone` (30-day retention).
2. **deploy** job (`ubuntu-latest`, gated by `production` environment):
   download artifact → install ssh key → `rsync -az --delete`
   `.next/standalone/` → `/opt/eventup-admin-web/` on origin → `sudo
   systemctl restart eventup-admin-web` → smoke `https://admin-marketplace.speakup.ltd/login`.

Concurrency group `deploy-prod` serializes pushes — never two deploys
in flight against the same box. `workflow_dispatch` is also wired for
manual replay.

### Required repo secrets

| Secret           | Value                                                     |
| ---------------- | --------------------------------------------------------- |
| `PROD_SSH_HOST`  | `13.203.173.33` (marketplace origin box)                  |
| `PROD_SSH_USER`  | `ubuntu`                                                  |
| `PROD_SSH_KEY`   | OpenSSH private key (matching pubkey in `~ubuntu/.ssh/authorized_keys`) |

### Origin box one-time provisioning

The box `13.203.173.33` also hosts `marketplace.speak-up.pro` on `:3000`.
The admin app is deployed strictly inside its own dir / port / unit so
the two never contend.

```
# Node 22 (matches .nvmrc; deploy.yml builds against it on CI)
sudo apt-get install -y nodejs   # via NodeSource setup_22.x

# App dir owned by deploy user
sudo mkdir -p /opt/eventup-admin-web && sudo chown ubuntu:ubuntu /opt/eventup-admin-web

# Env file (NODE_ENV, PORT=3001, NEXT_PUBLIC_API_URL=https://api.speak-up.pro)
sudo mkdir -p /etc/eventup-admin-web
sudo install -m 0640 -o root -g ubuntu /dev/stdin /etc/eventup-admin-web/env <<EOF
NODE_ENV=production
PORT=3001
HOSTNAME=127.0.0.1
NEXT_PUBLIC_API_URL=https://api.speak-up.pro
EOF

# systemd unit — see /etc/systemd/system/eventup-admin-web.service in repo notes.
# Resource isolation: CPUQuota=50%, MemoryMax=512M, ReadWritePaths=/opt/eventup-admin-web,
# ProtectSystem=strict, PrivateTmp, NoNewPrivileges, etc.
sudo systemctl daemon-reload
sudo systemctl enable eventup-admin-web

# Cloudflare Origin CA cert (15-year, request_type=origin-rsa) installed at:
#   /etc/ssl/cloudflare/admin-marketplace.speakup.ltd.{crt,key}
# Private key was generated on origin (never left the box); CF signed the CSR.

# nginx vhost: TLS terminate w/ Origin CA cert, real-IP via cf-connecting-ip,
# proxy_pass http://127.0.0.1:3001. Cloudflare zone SSL mode = Full (strict).
sudo ln -sf /etc/nginx/sites-available/admin-marketplace.speakup.ltd \
            /etc/nginx/sites-enabled/admin-marketplace.speakup.ltd
sudo nginx -t && sudo systemctl reload nginx
```

### Sibling-app isolation guarantees

- Dir: `/opt/eventup-admin-web/` (sibling marketplace app lives elsewhere)
- Port: `3001` (sibling is `3000`)
- systemd unit: `eventup-admin-web.service` (sibling uses pm2)
- `ReadWritePaths=/opt/eventup-admin-web` — kernel-enforced; the app
  cannot mutate anything outside its dir
- `CPUQuota=50%` + `MemoryMax=512M` — capped resource share
- `rsync --delete` is scoped to `$REMOTE_DIR`; never touches sibling
  directories

### Smoke after deploy

The deploy job already runs an in-process smoke (`curl https://admin-marketplace.speakup.ltd/login` → 200). Manual extras:

- `journalctl -u eventup-admin-web -n 50` — clean
- DevTools cookies on real login: `eventup_admin_access` + `_refresh` are HttpOnly, Secure, SameSite=Lax, domain `admin-marketplace.speakup.ltd`
- `/services` + `/providers` render real backend rows (CORS allow-list must contain `https://admin-marketplace.speakup.ltd` — handled in monolith repo)
