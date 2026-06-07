# eventup-admin-web

Internal admin UI for EventUp marketplace moderation. Next.js 16 + Tailwind v4 + httpOnly-cookie auth against the EventUp backend (`api.speak-up.pro`). Operator-only traffic, self-hosted on the same prod box as the API.

## Local dev

```bash
nvm use            # Node 22 (see .nvmrc)
pnpm install
cp .env.example .env.local
pnpm dev           # http://localhost:3000
```

`.env.example` documents the two `NEXT_PUBLIC_USE_MOCK_*` toggles that let the app run standalone against in-process msw fixtures (used by the e2e suite). Disable both for real-backend dev.

## Scripts

| Command           | What it does                                                   |
| ----------------- | -------------------------------------------------------------- |
| `pnpm dev`        | Next dev server, port 3000                                     |
| `pnpm build`      | Production build; emits `.next/standalone/server.js`           |
| `pnpm start`      | Run the built app (port 3000)                                  |
| `pnpm lint`       | ESLint (strict, no warnings tolerated)                         |
| `pnpm test:e2e`   | Playwright e2e suite (mock auth + mock backend, 18 tests)      |

## Deploy

Production URL: `https://admin-marketplace.speakup.ltd`. Self-hosted on the same box that serves `marketplace.speak-up.pro` (origin `13.203.173.33`), behind Cloudflare proxy. nginx in front of a systemd-managed Node process listening on `127.0.0.1:3001`. TLS terminates at the Cloudflare edge; origin uses a Cloudflare Origin CA certificate so the edge-to-origin hop stays encrypted (Full strict).

### CI deploy (preferred)

GitHub Actions workflow `Deploy` (`.github/workflows/deploy.yml`) is `workflow_dispatch` only — no auto-deploy on merge. It builds, rsyncs `.next/standalone/` to the prod box, and `systemctl restart`s the service.

Repo secrets required before first run:

| Secret          | Value                                                    |
| --------------- | -------------------------------------------------------- |
| `PROD_SSH_HOST` | Prod box host or IP                                      |
| `PROD_SSH_USER` | SSH user (must be sudoer for `systemctl restart`)        |
| `PROD_SSH_KEY`  | OpenSSH PEM private key for that user                    |

Trigger from the Actions tab → "Deploy" → "Run workflow".

### Local deploy (fallback)

```bash
PROD_SSH_HOST=api.speak-up.pro \
PROD_SSH_USER=ubuntu \
SSH_KEY_PATH=~/.ssh/your_prod_key \
./scripts/deploy.sh
```

### One-time prod box provisioning

These run once per host; not committed because they touch host config.

**1. Node 22 + rsync**

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs rsync
```

**2. systemd unit** — `/etc/systemd/system/eventup-admin-web.service`

```ini
[Unit]
Description=EventUp admin web (Next.js standalone)
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/eventup-admin-web
EnvironmentFile=/etc/eventup-admin-web/env
ExecStart=/usr/bin/node /opt/eventup-admin-web/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**3. env file** — `/etc/eventup-admin-web/env` (mode 0640, owner root:www-data)

```
NEXT_PUBLIC_API_URL=https://api.speak-up.pro
NODE_ENV=production
PORT=3001
HOSTNAME=127.0.0.1
```

Do NOT set `NEXT_PUBLIC_USE_MOCK_AUTH` or `NEXT_PUBLIC_USE_MOCK_BACKEND` here — prod must hit real backend.

**4. Cloudflare Origin CA cert**

In the Cloudflare dashboard for zone `speakup.ltd` → SSL/TLS → Origin Server → **Create Certificate**. Hostnames: `admin-marketplace.speakup.ltd`. Validity: 15 years. Save the certificate + private key to the origin as:

```
/etc/ssl/cloudflare/admin-marketplace.speakup.ltd.crt   (mode 0644)
/etc/ssl/cloudflare/admin-marketplace.speakup.ltd.key   (mode 0640, root:www-data)
```

Confirm SSL/TLS mode on the zone is **Full (strict)** — edge ↔ origin is then encrypted and the origin cert is validated.

**5. nginx vhost** — `/etc/nginx/sites-available/admin-marketplace.speakup.ltd`

```nginx
# Trust Cloudflare so $remote_addr / X-Forwarded-For carry the real client IP.
# CF IP list: https://www.cloudflare.com/ips/  (refresh periodically)
# Shared snippet at /etc/nginx/conf.d/cloudflare-real-ip.conf is preferred.

server {
    listen 80;
    server_name admin-marketplace.speakup.ltd;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin-marketplace.speakup.ltd;

    ssl_certificate     /etc/ssl/cloudflare/admin-marketplace.speakup.ltd.crt;
    ssl_certificate_key /etc/ssl/cloudflare/admin-marketplace.speakup.ltd.key;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host  $host;
        proxy_buffering off;
        proxy_read_timeout 60s;
    }
}
```

Enable + reload:

```bash
sudo ln -s /etc/nginx/sites-available/admin-marketplace.speakup.ltd /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**6. DNS record** — Cloudflare dashboard for zone `speakup.ltd` → DNS → Records → Add record. Type `A`, Name `admin-marketplace`, IPv4 `13.203.173.33`, Proxy status **Proxied (orange cloud)**, TTL Auto. SSL/TLS mode on the zone must be Full (strict) so the edge-to-origin hop validates the Origin CA cert.

**7. Backend CORS** — EventUp backend must allow `https://admin-marketplace.speakup.ltd` as a CORS origin (credentials: include).

**8. Enable the service**

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now eventup-admin-web
sudo systemctl status eventup-admin-web
```

### Smoke checklist after first deploy

- `curl -sI https://admin-marketplace.speakup.ltd/login` → `200`
- Browser login with real admin creds → land on `/`
- DevTools: `eventup_admin_access` + `eventup_admin_refresh` cookies are `Secure` + `HttpOnly` + `SameSite=Lax`, domain = `admin-marketplace.speakup.ltd`
- `/services` and `/providers` render real backend rows (verify IDs against prod DB)
- Moderate one throwaway row end-to-end; audit row appears in prod DB
- `journalctl -u eventup-admin-web -n 50` clean
