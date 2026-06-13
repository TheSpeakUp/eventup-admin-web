# Operator Dashboard — admin-web home

**Date:** 2026-06-13
**Status:** Approved (design), pending implementation
**Repo:** `eventup-admin-web` (branch `feat/operator-dashboard`)

## Goal

Replace the stub home page (`src/app/(routes)/page.tsx` — currently just `<h1>EventUp Admin</h1>`) with an operator dashboard that wires the four already-shipped backend endpoints under `/eventup-admin/v1/marketplace/dashboard`: revenue, payments funnel, content growth, and tops. KPI cards + tables + time-series charts. Zero backend work (endpoints live on eventup-backend main).

## Backend contract (verified, live)

Base: `GET /eventup-admin/v1/marketplace/dashboard/...`. Query params (all optional): `from`, `to` (ISO datetime), `granularity` = `day|week|month`, `currency` (revenue only), `limit` (tops, 1–50, default 10).

| Endpoint | Perm (role tier) | Response (key fields) |
|---|---|---|
| `/revenue` | `ADMIN_PAYMENTS_READ` (ADMIN) | `{granularity, buckets:[{period, currency, resource_type, gross_minor, net_minor, payment_count}]}` |
| `/funnel` | `ADMIN_PAYMENTS_READ` (ADMIN) | `{status_counts:[{status,count}], failure_reasons:[{failure_code,count}]}` |
| `/content-growth` | `ADMIN_MARKETPLACE_READ` (MODERATOR) | `{granularity, buckets:[{period, new_providers, new_services, new_offers}]}` |
| `/tops` | `ADMIN_PAYMENTS_READ` (ADMIN) | `{providers:[{provider_id,provider_name,currency,gross_minor,payment_count}], services:[{service_id,service_title,provider_id,provider_name,currency,gross_minor,payment_count}], promo_discounts:[{currency,discount_minor,usage_count}]}` |

Money fields are **minor units** (cents). On insufficient permission the backend returns 403 (envelope `error.meta.original_detail = "insufficient permission"`); `apiFetch` surfaces `{ok:false, status:403, ...}`.

## admin-web facts (verified)

- `apiFetch<T>()` (`src/lib/api.ts`) is **server-only**, returns `{ok:true,status,data} | {ok:false,status,message,...}`. Use `redirectOn401:false` is unnecessary for reads (401 → redirect /login is fine).
- Pages are RSC. **`searchParams` is async** in this Next: `searchParams: Promise<{...}>` → `const sp = await searchParams`.
- `getAdminSession()` (`src/lib/auth/session.ts`) returns `{ role: AdminRole | null }` — **role only, no fine-grained perm list**. Role tiers: SUPERADMIN > ADMIN > MODERATOR.
- `formatMoneyMinor(amount_minor, currency)` exists in `src/lib/format.ts` — reuse for all money.
- No charting library present → **add `recharts`** (client-only; wrap chart components in `"use client"`; if SSR errors, import via `next/dynamic` with `ssr:false`).
- DS tokens: follow existing pages (Tailwind zinc palette / `app/design-system.css` tokens). Mirror an existing page (e.g. `(routes)/traffic/page.tsx`, `(routes)/quality/page.tsx`) for card/table styling + `searchParams` handling.
- e2e: Playwright + MSW (`src/mocks/handlers.ts`), mock auth.

## Architecture

**`src/app/(routes)/page.tsx`** (server component, the home/dashboard):
1. `await searchParams` → `{ from?, to?, granularity?, currency? }`. Defaults: `to=now`, `from=now-30d`, `granularity=day`.
2. `getAdminSession()` → role. Compute capability flags: `canSeePayments = role ∈ {ADMIN, SUPERADMIN}`, `canSeeGrowth = role ∈ {MODERATOR, ADMIN, SUPERADMIN}`. (Belt-and-suspenders; the per-section 403 handling below is the real guard.)
3. Server-fetch the permitted endpoints **in parallel** (`Promise.all`) via the new `src/lib/dashboard/api.ts`. Each returns `ApiFetchResult<T>`.
4. Render sections; each section independently handles its own `{ok:false}` (403 → "No access", other → "Couldn't load", empty buckets → "No data for this range"). One failing section never blocks the others.

**`src/lib/dashboard/api.ts` + `types.ts`** — typed wrappers for the 4 endpoints, building the querystring from the date-range params (reuse the `withQs`/`append` helper pattern from `src/lib/offers/api.ts` if present).

**`src/app/(routes)/_components/dashboard/`** (new dir):
- `DateRangeControls.tsx` (`"use client"`) — from/to date inputs + granularity select; on change, navigates to the same path with updated searchParams (`useRouter().push` / a `<form>` GET). No global state.
- `KpiCards.tsx` (server) — summary tiles: total gross revenue (sum of revenue buckets' gross_minor per currency), total payment_count, new providers/services/offers (sums from content-growth), total promo discount. Uses `formatMoneyMinor`.
- `RevenueChart.tsx` (`"use client"`, recharts) — stacked bar of gross by `period` × `resource_type` (one series per resource_type). Receives plain serializable data as props.
- `ContentGrowthChart.tsx` (`"use client"`, recharts) — multi-line: new_providers/new_services/new_offers over `period`.
- `FunnelSection.tsx` (server) — status_counts as a small horizontal CSS bar list + failure_reasons table.
- `TopsSection.tsx` (server) — three ranked tables (providers / services / promo discounts).

**Data flow:** server component fetches → passes serializable arrays to client chart components as props (no client-side fetching; charts are pure render). Date controls drive `searchParams` → server refetch.

## Permission handling

Render order is fixed; visibility is per-section:
- `canSeeGrowth=false` → skip Content-growth chart + its KPIs.
- `canSeePayments=false` → skip Revenue/Funnel/Tops + money KPIs; show a one-line "Revenue & payments require ADMIN" note.
- Additionally, if a fetched section returns `{ok:false, status:403}`, render that section's "No access" placeholder (covers role-map drift).

## Error / empty states

Each section is self-contained: `{ok:false, 403}` → "No access"; `{ok:false, other}` → "Couldn't load — try again"; `ok` but empty buckets/rows → "No data for the selected range". Charts render an empty frame with the empty note rather than crashing on `[]`.

## Testing

- Playwright `tests/dashboard.spec.ts` + MSW handlers for the 4 endpoints (in `src/mocks/handlers.ts`): assert KPI cards show formatted money, charts render (testid present), tops/funnel tables populate, and changing the date range re-requests (mock asserts query params or just that the page re-renders with new mock data).
- A second test: mock `/revenue` (and funnel/tops) → 403 → assert "No access" placeholder, while content-growth still renders (role-split rendering).
- Verify: `npm run lint` + `npm run build` + `npx playwright test`. CI runs on the self-hosted runner; deploy via the self-hosted runner; live-smoke (login → home shows dashboard with real data).

## Out of scope (YAGNI)

- Traffic/analytics (`analytics_admin_views`) — already covered by `/traffic`. Dashboard does NOT duplicate it (optionally a "View traffic →" link to `/traffic`).
- No CSV export on the dashboard (list surfaces already have it).
- No realtime/auto-refresh; data is per-request SSR.

## Delivery

Single PR `feat/operator-dashboard` → admin-web `main`. Adds `recharts` dependency. Verified green on self-hosted CI, deployed via self-hosted runner, live-smoke on admin-marketplace.speakup.ltd.
