# EventUp Admin — Categories Content-Management UI (B1 frontend, PR1)

**Date:** 2026-06-09
**Repo:** `eventup-admin-web` (Next.js 16, React 19, Tailwind v4, App Router, pnpm)
**Branch policy:** feature PR → `main` (auto-deploys to admin-marketplace.speakup.ltd). `main` merge needs explicit user confirm-this-turn.
**Scope decision:** Option 3 — full CRUD + translations editor + raw-JSON `attribute_schema` editor (user-approved 2026-06-09).

## Why

Phase 1 admin SPA covers services / providers / offers / admin-team. The largest "backend shipped, no frontend" gap is the B1 content surface (categories, attribute-definitions, bindings, translations, registry snapshots). This PR ships the **categories** sub-domain — the most concrete operator need. The other sub-domains ship as separate PRs (F9 attribute-definitions, F10 translations admin, F13 registry/audit).

## Backend contract (verified against `eventup-backend` `origin/main`, package `src/eventup/admin/marketplace/`)

> Correction to handoff: the contract lives in **`eventup-backend` `origin/main`** under `src/eventup/admin/marketplace/`, NOT `speakup_backend_staging` (that is the monolith with `/admin/v2/`). Namespace is `/eventup-admin/v1/marketplace/*`, same as the offers/providers/services routers the SPA already calls.

Namespace prefix: `/eventup-admin/v1/marketplace`. ID type: `int`.

| Verb | Path | Permission | Role floor |
|---|---|---|---|
| POST | `/categories/list` | `ADMIN_MARKETPLACE_READ` | ADMIN+ |
| GET | `/categories/{category_id}` | `ADMIN_MARKETPLACE_READ` | ADMIN+ |
| POST | `/categories` → 201 | `ADMIN_MARKETPLACE_SERVICES_MODERATE` | ADMIN+ |
| PUT | `/categories/{category_id}` | `ADMIN_MARKETPLACE_SERVICES_MODERATE` | ADMIN+ |
| DELETE | `/categories/{category_id}` | `ADMIN_MARKETPLACE_PROVIDERS_RISK` | ADMIN+ |

**List request** (`MarketplaceCategoryFilter`, POST body): `search: str|None`, `last_id: int|None` (cursor pivot), `limit: int` (default 50, 1–100), `sort: "sort_order_asc"|"sort_order_desc"|"name_asc"|"name_desc"|None`.
**List response** (`MarketplaceCategoryCursorPage` extends `vendored_core.schemas.CursorPageByIdInt`): `{ items: MarketplaceCategoryRead[], next_last_id: int|None, has_more: bool, count: int }`. Next page = re-POST with `last_id = next_last_id`.

**`MarketplaceCategoryRead`:** `id:int, name:str, slug:str, icon:str|None, description:str|None, sort_order:int, parent_id:int|None, is_leaf:bool, attribute_schema:dict|None, publication_currency:str|None, publication_price_monthly:Decimal|None, publication_price_monthly_discounted:Decimal|None`.

**`MarketplaceCategoryCreate`:** `name`(1–100, req), `slug`(1–100, req), `icon`(≤255|None), `description`(str|None), `name_translations`(dict[locale]→str|None), `description_translations`(dict[locale]→str|None), `sort_order`(int, default 100, 0–10000), `parent_id`(int|None, ≥1), `attribute_schema`(dict|None), `publication_currency`(3–10|None), `publication_price_monthly`(Decimal ≥0|None), `publication_price_monthly_discounted`(Decimal ≥0|None).

**`MarketplaceCategoryUpdate`:** every field above optional (`None` = leave unchanged — PUT acts PATCH-like). Same validators as create.

**Cross-field validators (FE MUST mirror in Zod):**
- `publication_currency` required when `publication_price_monthly` is set.
- `publication_price_monthly` required when `publication_price_monthly_discounted` is set.
- `publication_price_monthly_discounted` ≤ `publication_price_monthly`.

**`attribute_schema` shape** (`validate_category_attributes_schema`): object keyed by attribute key; each descriptor `{ type?, required?:bool, searchable?:bool, enum?:[scalars] }`. `type` ∈ `{string, integer, number, boolean, date, datetime, array_string, array_integer, array_number, array_boolean}`. `enum` must be a non-empty list of scalars.

**Translations:** open `dict[locale]→str`. No fixed supported-locale enum; backend normalizes the locale code (`normalize_locale_candidate`); default locale `en`.

**Step-up:** `require_step_up` wraps mutations but `STEP_UP_REQUIRED_PERMISSIONS = set()` (empty) today → reduces to a plain permission check. No MFA-challenge UI (F12) needed for categories CRUD. Confirmed identical to already-shipped offers/providers moderation, which also wrap `require_step_up` and work with a normal token.

## Architecture (mirror `admins` / `providers`)

### Routes & files — `src/app/(routes)/categories/`
- `page.tsx` — server component list: cursor table, search box, sort control, empty-state, columns (name, slug, parent name, sort_order, leaf?), row → detail. "New category" button gated to MODERATE.
- `[id]/page.tsx` — detail + edit form (renders `CategoryForm` in edit mode).
- `new/page.tsx` — create form (`CategoryForm` in create mode).
- `[id]/actions.ts`, `new/actions.ts` — server actions: Zod-validated FormData → `ActionState`, `revalidatePath`. Mirror `admins/[id]/actions.ts`.
- `_components/`:
  - `CategoryForm.tsx` — `useActionState` form (React 19 uncontrolled `<form action>` reset gotcha from #18 applies — heed it).
  - `TranslationsEditor.tsx` — dynamic locale rows (locale code + value) for `name_translations` and `description_translations`; add/remove rows; serializes to dict.
  - `AttributeSchemaEditor.tsx` — raw-JSON `<textarea>`; on submit `JSON.parse` + shape check (type ∈ supported set, `required`/`searchable` boolean, `enum` non-empty scalars); inline parse/validation error.
  - `DeleteCategoryButton.tsx` — confirm dialog; rendered only for SUPERADMIN.
  - small table/badge bits as needed (reuse existing `_components` idioms).

### API client — `src/lib/categories/`
- `types.ts` — `MarketplaceCategoryRead`, create/update payloads, cursor page type, sort enum.
- `api.ts` — `BASE = "/eventup-admin/v1/marketplace"`; uses `apiFetch` + `buildApiUrl`.
  - `listCategories(filter)` → **POST** `/categories/list` with JSON body (divergence from providers, which use GET query — categories list is body-filtered).
  - `getCategory(id)` → GET `/categories/{id}`.
  - `createCategory(payload)` → POST `/categories` (`redirectOn401:false`).
  - `updateCategory(id, payload)` → PUT `/categories/{id}` (`redirectOn401:false`).
  - `deleteCategory(id)` → DELETE `/categories/{id}` (`redirectOn401:false`).

### Error handling
Rely on the generic envelope: `readError` already reads `error.meta.original_detail → message → detail → message`. Do NOT add per-case client-side messages (anti-pattern removed in #20). Backend surfaces validator failures (pricing, schema, slug uniqueness, FK on delete) via `original_detail`.

### Nav gating & roles — `src/app/(routes)/layout.tsx` + `src/lib/auth/session.ts`

Role→permission map (verified `eventup-backend` `origin/main` `src/eventup/admin/permissions.py`):
- **MODERATOR** = `ADMIN_MARKETPLACE_READ` + `SERVICES_MODERATE` (+ offers/queue) → can list, view, **create, edit**. No `PROVIDERS_RISK` → **no delete**.
- **ADMIN** = MODERATOR perms + `PROVIDERS_RISK` (+ run-log, dispatch, payments) → **can delete**.
- **SUPERADMIN** = all permissions.

Gating:
- Sidebar: add `{ href: "/categories", label: "Categories" }`. Visible to all three roles (all hold READ) — no `superadminOnly` flag.
- "New category" / edit submit: visible to all three (all hold `SERVICES_MODERATE`).
- Delete: visible to **ADMIN + SUPERADMIN** (hold `PROVIDERS_RISK`), hidden for MODERATOR. The existing layout only models a `superadminOnly` boolean — add a small role-tier check (`role !== "MODERATOR"`, i.e. ADMIN-or-above) for the delete control rather than reusing `superadminOnly`.
- Page-level guard: backend returns 403 for insufficient role → page renders a "requires higher role" state rather than crashing (fail-closed, mirror `admins` page guard).
- Parent dropdown: fetch a single `limit=100` page of categories for the select (note: catalog is small; revisit if it grows past 100).

### Mock backend (MSW) — required for e2e
- `src/mocks/content-store.ts` — in-memory category store (int ids, cursor pagination, search/sort), mirror `admins-store.ts`. Seed: a couple of root categories, one child (parent_id set), one with `name_translations`/`description_translations`, one with a sample `attribute_schema`.
- Handlers in `src/mocks/handlers.ts` for all 5 routes. Enforce role from bearer where it affects gating tests (reuse `operatorSub()` / role helper added in #20 if present).

### Tests — `tests/`
- `categories-list.spec.ts` — list renders, search, sort, empty-state, pagination cursor.
- `categories-crud.spec.ts` — create (incl. translations row + attribute_schema JSON), edit (partial update leaves untouched fields), delete with confirm; pricing cross-field validation surfaces error; invalid JSON schema surfaces error.
- `categories-guards.spec.ts` — role gating: MODERATOR can create/edit but sees no Delete; READ-only role sees no New/Edit; SUPERADMIN sees all. Use `tests/helpers/login.ts` `{email}` (admin@example.com=SUPERADMIN, mod@example.com=MODERATOR).

## Verification
- `pnpm lint` (eslint) — clean.
- `pnpm build` with `NEXT_PUBLIC_USE_MOCK_AUTH=true NEXT_PUBLIC_USE_MOCK_BACKEND=true NEXT_PUBLIC_API_URL=http://127.0.0.1:65535` — TS type-check gate.
- `pnpm exec playwright test` — new specs green.
- CI (`ci.yml`, ubuntu-latest) gates the PR (build + e2e). `deploy.yml` auto-deploys on merge to main.
- Live smoke at admin-marketplace.speakup.ltd as `shelp.dev@gmail.com` (SUPERADMIN) — user types the password.

## Pre-code gate
AGENTS.md: read the relevant Next 16 guide in `node_modules/next/dist/docs/` before writing code (App Router server actions / forms; React 19 `<form action>` reset). Verify the docs path exists first (early `ls` returned empty — confirm before relying on it; if absent, fall back to context7 Next.js docs).

## Out of scope (separate PRs)
attribute-definitions CRUD (F9), category↔attribute bindings panel (F8.x), per-attribute translations (F10), registry snapshots / rollback viewer (F13), MFA step-up UI (F12).
