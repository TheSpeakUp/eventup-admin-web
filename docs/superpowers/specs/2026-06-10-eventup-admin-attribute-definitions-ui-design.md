# EventUp Admin — Attribute-Definitions CRUD UI (F9)

**Date:** 2026-06-10
**Repo:** `eventup-admin-web` (Next.js 16, React 19, Tailwind v4, App Router, pnpm)
**Branch policy:** feature PR → `main` (auto-deploys to admin-marketplace.speakup.ltd). `main` merge needs explicit user confirm-this-turn + live smoke.
**Scope decision:** CRUD only. Translations sub-resource (`/attribute-definitions/{key}/translations`) deferred to a separate PR (F10) — user-approved 2026-06-10. One sub-domain per PR, same as categories (F8).

## Why

The B1 content surface ships one sub-domain per PR. Categories (F8) shipped 2026-06-10 (PR #21, live-smoke green). This PR ships the **attribute-definitions** sub-domain — the global attribute registry that categories bind to. It is a near-verbatim mirror of the categories feature; this spec records only the deltas against that proven template.

**Template:** spec `docs/superpowers/specs/2026-06-09-eventup-admin-categories-ui-design.md`, plan `docs/superpowers/plans/2026-06-09-eventup-admin-categories-ui.md`, code `src/app/(routes)/categories/`, `src/lib/categories/`, `src/mocks/categories-{store,fixtures}.ts`, `tests/categories-{list,crud,guards}.spec.ts`.

## Backend contract (verified `eventup-backend` `origin/main`)

Source: `src/eventup/admin/marketplace/attribute_definitions_views.py` + `attribute_registry_admin_schemas.py`.
Namespace prefix: `/eventup-admin/v1/marketplace`.

> **Key difference from categories: the path param is `attribute_key` (str), NOT an int `id`.** The numeric `id` is internal (returned in Read, never in the URL); `key` is the public identifier and the route segment.

| Verb | Path | Permission | Role floor |
|---|---|---|---|
| POST | `/attribute-definitions/list` | `ADMIN_MARKETPLACE_READ` | MODERATOR+ |
| GET | `/attribute-definitions/{attribute_key}` | `ADMIN_MARKETPLACE_READ` | MODERATOR+ |
| POST | `/attribute-definitions` → 201 | `ADMIN_MARKETPLACE_SERVICES_MODERATE` | MODERATOR+ |
| PUT | `/attribute-definitions/{attribute_key}` | `ADMIN_MARKETPLACE_SERVICES_MODERATE` | MODERATOR+ |
| DELETE | `/attribute-definitions/{attribute_key}` | `ADMIN_MARKETPLACE_PROVIDERS_RISK` | ADMIN+ |

**List request** (`MarketplaceAttributeDefinitionFilter`, POST body): `search: str|None (≤200)`, `group_name: str|None (≤64)`, `is_active: bool|None`, `last_id: int|None (≥1, cursor pivot)`, `limit: int (default 50, 1–100)`, `sort: MarketplaceAttributeDefinitionSort|None`.
**Sort enum:** `key_asc | key_desc | sort_order_asc | sort_order_desc` (NOTE: `key_*` replaces categories' `name_*`).
**List response** (`MarketplaceAttributeDefinitionListResponse`): `{ items: MarketplaceAttributeDefinitionRead[], next_last_id: int|None, has_more: bool, count: int }`. Next page = re-POST with `last_id = next_last_id`. Same cursor shape as categories.

**`MarketplaceAttributeDefinitionRead`:** `id:int, key:str, descriptor:dict, group_name:str|None, sort_order:int, is_active:bool, is_system:bool, bindings_count:int`.

**`MarketplaceAttributeDefinitionCreate`:** `key`(str, 1–100, req — unique identifier), `descriptor`(dict|str, req), `group_name`(≤64|None), `sort_order`(int, default 100, 0–10000), `is_active`(bool, default True), `is_system`(bool, default False).

**`MarketplaceAttributeDefinitionUpdate`:** `descriptor?`, `group_name?`, `sort_order?`, `is_active?`, `is_system?` — all optional. **`key` is NOT updatable** (immutable PK). **Empty body → 400** (`update` with no fields is rejected — divergence from categories' all-optional PATCH semantics; the edit form always submits fields so this is fine in practice, but the mock must mirror it for parity).

**`descriptor` handling:** backend `_normalize_single_descriptor(value: dict|str) -> dict` accepts either a JSON object or a JSON string and normalizes to a dict; Read always returns `descriptor: dict`. **Deep schema validation lives in the backend.** The FE does NOT re-implement it (avoids duplicating backend logic + false rejections) — user-approved 2026-06-10.

**Step-up:** mutations wrap `require_step_up(...)` but `STEP_UP_REQUIRED_PERMISSIONS = set()` → plain permission check. No MFA UI. Identical to categories.

## Architecture (mirror `categories`)

### Routes & files — `src/app/(routes)/attribute-definitions/`
- `page.tsx` — server-component list: cursor table, search box, `group_name` + `is_active` filters, sort control, empty-state. Columns: `key`, `group_name`, `sort_order`, `is_active`, `is_system`, `bindings_count`. Row → detail. "New attribute definition" button gated to MODERATE. Mirror `categories/page.tsx`.
- `[key]/page.tsx` — detail + edit form (`AttributeDefinitionForm` in edit mode). `key` shown read-only.
- `new/page.tsx` — create form (`AttributeDefinitionForm` in create mode). `key` is an editable required field here only.
- `[key]/actions.ts`, `new/actions.ts` — server actions: Zod-validated FormData → `ActionState`, `revalidatePath`. Mirror `categories/[id]/actions.ts` + `new/actions.ts`. `ActionState` type lives in a separate `action-types.ts` (not the `"use server"` file).
- `_components/`:
  - `AttributeDefinitionForm.tsx` — `useActionState` form. React 19 uncontrolled `<form action>` reset gotcha (#18) applies — use the **key-remount idiom** from `categories/[id]/page.tsx`.
  - `DescriptorEditor.tsx` — raw-JSON `<textarea>` (rename of categories' `AttributeSchemaEditor`). On submit: `JSON.parse` only; accept any valid JSON (object or string per the dict|str contract); inline parse-error on invalid JSON. No shape check — backend validates.
  - `DeleteAttributeDefinitionButton.tsx` — confirm dialog; rendered only for ADMIN+ (`role !== "MODERATOR"`). Mirror `DeleteCategoryButton.tsx`.

### API client — `src/lib/attribute-definitions/`
- `types.ts` — `AttributeDefinitionRead`, `AttributeDefinitionCursorPage`, `AttributeDefinitionListQuery`, `AttributeDefinitionMutationPayload`, `ATTRIBUTE_DEFINITION_SORTS` const + `AttributeDefinitionSort` type + `isAttributeDefinitionSort` guard. `descriptor` typed as `Record<string, unknown>` on Read, `Record<string, unknown> | string` on payload.
- `api.ts` — `BASE = "/eventup-admin/v1/marketplace/attribute-definitions"`; uses `apiFetch`.
  - `listAttributeDefinitions(query)` → **POST** `/list` with JSON body (only set keys: `limit` always, plus `search`/`group_name`/`is_active`/`last_id`/`sort` when present). Mirror `listCategories`.
  - `getAttributeDefinition(key: string)` → GET `/{key}`.
  - `createAttributeDefinition(payload)` → POST `` (base) (`redirectOn401:false`).
  - `updateAttributeDefinition(key, payload)` → PUT `/{key}` (`redirectOn401:false`).
  - `deleteAttributeDefinition(key)` → DELETE `/{key}` (`redirectOn401:false`).

### Error handling
Generic envelope only (`result.message` / `original_detail`). No per-case client messages (anti-pattern removed in #20). Backend surfaces duplicate-key, invalid-descriptor, empty-update-400, and FK-on-delete via `original_detail`.

### Nav gating & roles — `src/app/(routes)/layout.tsx` + `src/lib/auth/session.ts`
Role→permission (verified `eventup-backend` `origin/main` `src/eventup/admin/permissions.py`):
- **MODERATOR** = READ + SERVICES_MODERATE → list, view, create, edit. No `PROVIDERS_RISK` → **no delete**.
- **ADMIN** = MODERATOR + `PROVIDERS_RISK` → **can delete**.
- **SUPERADMIN** = all.

Gating:
- Sidebar: add `{ href: "/attribute-definitions", label: "Attribute Definitions" }`. Visible to all three roles (all hold READ) — no `superadminOnly`.
- New / edit submit: all three roles (`SERVICES_MODERATE`).
- Delete: ADMIN + SUPERADMIN only (`role !== "MODERATOR"`), hidden for MODERATOR. Same role-tier check categories added.
- Page-level guard: backend 403 → "requires higher role" fail-closed state, not a crash (mirror categories/admins).

### Mock backend (MSW) — required for e2e
- `src/mocks/attribute-definitions-store.ts` — in-memory store mirroring `categories-store.ts`: int `id` internal, **keyed/looked-up by `key` string**, cursor pagination on `last_id`, `search` (over key + group_name), `group_name` + `is_active` filters, 4-value sort. Seed fixtures (`attribute-definitions-fixtures.ts`): a few definitions across ≥2 `group_name`s, mix of `is_active` true/false, one `is_system: true`, varied `bindings_count`, a representative `descriptor` dict.
- Handlers in `src/mocks/handlers.ts` for all 5 routes — literal `/attribute-definitions/list` registered **before** `/attribute-definitions/:key`. Enforce role from the bearer JWT `role` claim where gating tests need it (reuse the role helper from #20). Mirror the empty-body→400 on PUT for parity.

### Tests — `tests/`
- `attribute-definitions-list.spec.ts` — list renders, search, `group_name` + `is_active` filters, sort (key + sort_order), empty-state, cursor pagination.
- `attribute-definitions-crud.spec.ts` — create (incl. `descriptor` JSON), edit (`key` read-only; partial update leaves untouched fields), delete with confirm; invalid JSON descriptor surfaces inline error.
- `attribute-definitions-guards.spec.ts` — role gating via `tests/helpers/login.ts` `{email}`: MODERATOR (`mod@example.com`) creates/edits but sees no Delete; ADMIN (`ops@example.com`) + SUPERADMIN (`admin@example.com`) see Delete.

**Test isolation:** e2e shares ONE in-memory store per `next start` (workers:1, no per-test reset). Mutation tests create-then-mutate their OWN records; never touch fixtures other spec files assert on. File order is alphabetical.

## Verification
- `npm run lint` — clean.
- `npm run build` with mock env (`NEXT_PUBLIC_USE_MOCK_AUTH=true NEXT_PUBLIC_USE_MOCK_BACKEND=true NEXT_PUBLIC_API_URL=http://127.0.0.1:65535`) — TS type-check gate.
- `npm run test:e2e` — new specs green.
- CI (`ci.yml`, ubuntu-latest) gates the PR; `deploy.yml` auto-deploys on merge to main.
- Live smoke at admin-marketplace.speakup.ltd as `shelp.dev@gmail.com` (SUPERADMIN) — user types the password.

## Pre-code gate
AGENTS.md: read the relevant Next 16 guide in `node_modules/next/dist/docs/` before writing code (App Router server actions / forms; React 19 `<form action>` reset). If the docs path is absent, fall back to context7 Next.js.

## Out of scope (separate PRs)
Per-attribute translations + enum-value translations (F10 — the deferred sub-resource), category↔attribute bindings panel, registry snapshots / rollback / revalidation viewer (F13), MFA step-up UI (F12).
