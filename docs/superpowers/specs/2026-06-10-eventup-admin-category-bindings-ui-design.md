# EventUp Admin — Category↔Attribute Bindings UI (F14)

**Date:** 2026-06-10
**Repo:** `eventup-admin-web` (Next.js 16, React 19, Tailwind v4, App Router, pnpm)
**Branch policy:** feature PR → `main` (auto-deploys to admin-marketplace.speakup.ltd). `main` merge needs explicit user confirm-this-turn + live smoke.
**Scope decision:** bindings CRUD only, scoped per category. Mirrors the F8/F9 CRUD template (NOT the F13 read-only template). One sub-domain per PR.

## Why

The B1 content surface ships one sub-domain per PR. Categories (F8, PR #21), attribute-definitions (F9, PR #25), translations (F10, PR #32) and registry snapshots (F13, PR #34) are live. This PR ships the **category↔attribute bindings** sub-domain — the per-category attachment of global attribute definitions, with per-binding descriptor override and visibility flags. It is the glue between F8 and F9: an admin opens a category and manages which attributes apply to it.

**Template:** spec `docs/superpowers/specs/2026-06-10-eventup-admin-attribute-definitions-ui-design.md` (F9), code `src/app/(routes)/attribute-definitions/`, `src/lib/categories/`, `src/mocks/attribute-definitions-{store,fixtures}.ts`, `tests/attribute-definitions-{list,crud,guards}.spec.ts`. Sub-route placement precedent: F10 (`attribute-definitions/[key]/translations`).

## Backend contract (verified `eventup-backend` `origin/main`)

Source: `src/eventup/admin/marketplace/category_bindings_views.py` + `attribute_registry_admin_schemas.py`.
Namespace prefix: `/eventup-admin/v1/marketplace`.

| Verb | Path | Permission | Role floor |
|---|---|---|---|
| GET | `/categories/{category_id}/bindings` | `ADMIN_MARKETPLACE_READ` | MODERATOR+ |
| PUT | `/categories/{category_id}/bindings/{attribute_key}` | `ADMIN_MARKETPLACE_SERVICES_MODERATE` | MODERATOR+ |
| DELETE | `/categories/{category_id}/bindings/{attribute_key}` | `ADMIN_MARKETPLACE_PROVIDERS_RISK` | ADMIN+ |

`category_id` is an int path param; `attribute_key` is the str key of the global attribute definition (same identifier style as F9). Step-up wraps PUT/DELETE but `STEP_UP_REQUIRED_PERMISSIONS = set()` → plain permission check, no MFA UI (identical to F8/F9).

**List response** (`MarketplaceCategoryAttributeBindingListResponse`): `{ items: MarketplaceCategoryAttributeBindingRead[], count: int }`. **No cursor, no filters, no sort params** — bindings per category are small; render all rows.

**`MarketplaceCategoryAttributeBindingRead`:** `binding_id:int, category_id:int, attribute_definition_id:int, attribute_key:str, descriptor:dict, group_name:str|None, sort_order:int, is_visible_in_filters:bool, is_visible_in_card:bool, is_system:bool(default False)`.

**`MarketplaceCategoryAttributeBindingUpsertRequest`:** `descriptor`(dict|str, **required**), `group_name`(≤64|None, default None), `sort_order`(int, default 100, 0–10000), `is_visible_in_filters`(bool, default True), `is_visible_in_card`(bool, default True).

> **PUT is a full upsert, not a partial PATCH.** Every omitted field falls back to its schema default (`group_name=None`, `sort_order=100`, flags=True) — it does NOT mean "unchanged". The edit form MUST always submit all five fields. Create and edit use the same endpoint: PUT on an unbound key creates the binding, PUT on a bound key replaces it.

**`descriptor` handling:** backend `_normalize_single_descriptor(dict|str) -> dict` — same as F9. FE does `JSON.parse` only; deep schema validation is backend-side. Read always returns a dict.

**DELETE response:** `AdminV2MarketplaceDeleteResponse` (`{success, message}`-style envelope, same as F8/F9).

**Errors:** unknown `category_id` or unknown `attribute_key` (no such definition) → 404 via `map_marketplace_exception`. Generic envelope only (`result.message` / `original_detail`), no per-case client messages.

## Architecture (mirror F8/F9, sub-route under categories)

### Routes & files — `src/app/(routes)/categories/[id]/attributes/`

- `page.tsx` — server-component list: GET bindings, table sorted by `sort_order` then `attribute_key` (client-side; API has no sort). Columns: `attribute_key` (link to edit), `group_name`, `sort_order`, `is_visible_in_filters`, `is_visible_in_card`, `is_system`. Empty-state. "Add attribute" button (visible to all roles — MODERATOR can upsert). Header shows the category name (fetch category via existing `getCategory`); unknown category → `notFound()`.
- `new/page.tsx` — **two-step add, same page, server-rendered via searchParams:**
  - No `?key=`: picker form (`method="GET"` form submitting to the same route) — a `<select>` of **active** attribute definitions (`listAttributeDefinitions({ is_active: true, limit: 100 })`) minus already-bound keys for this category. Known cap: >100 active definitions won't all appear (fine at current scale; noted limitation, free-text not needed yet).
  - With `?key=X`: full binding form **prefilled from the definition** (`getAttributeDefinition(key)` → descriptor, group_name, sort_order; flags default true). Key shown read-only. Submit → PUT.
- `[key]/page.tsx` — edit page. **No GET-by-key binding endpoint** → fetch the list, find by `attribute_key`, `notFound()` if absent (F13 reconstruct-from-list precedent). Form prefilled from the binding row; `attribute_key` read-only. Delete button rendered for ADMIN+ only.
- `actions.ts` + `action-types.ts` at `attributes/` level — `"use server"` actions (upsert, delete): Zod-validated FormData → `ActionState`, `revalidatePath` of the bindings list, redirect to list on success. `ActionState` in separate `action-types.ts` (F8 lesson).
- `_components/`:
  - `BindingForm.tsx` — `useActionState` form, key-remount reset idiom. Fields: descriptor (raw-JSON textarea, parse-error inline), `group_name`, `sort_order` (number input), `is_visible_in_filters` + `is_visible_in_card` checkboxes via the **hidden `value="false"` sentinel + `formData.getAll(...).includes("true")`** pattern (F9 lesson). Always submits all five fields (full-upsert semantics above).
  - `BindingsTable.tsx` — list table.
  - `DeleteBindingButton.tsx` — confirm dialog, rendered only when `role !== "MODERATOR"`. Mirror `DeleteAttributeDefinitionButton.tsx`.
- Entry point: "Attributes" link on the category detail page (`categories/[id]/page.tsx`) → `/categories/[id]/attributes`. No new sidebar item (bindings are category-scoped, not a top-level domain).

### API client — extend `src/lib/categories/` (F10 precedent: sub-resource lives in the parent domain's lib)

- `types.ts` adds: `CategoryAttributeBindingRead`, `CategoryAttributeBindingListResponse`, `CategoryAttributeBindingUpsertPayload` (`descriptor: Record<string, unknown> | string`, `group_name: string | null`, `sort_order: number`, `is_visible_in_filters: boolean`, `is_visible_in_card: boolean` — all required in the payload type to enforce full-upsert at compile time).
- `api.ts` adds (BASE `/eventup-admin/v1/marketplace/categories`):
  - `listCategoryBindings(categoryId)` → GET `/{id}/bindings`.
  - `upsertCategoryBinding(categoryId, key, payload)` → PUT `/{id}/bindings/{encodeURIComponent(key)}` (`redirectOn401: false`).
  - `deleteCategoryBinding(categoryId, key)` → DELETE same path (`redirectOn401: false`).
- The new-page picker reuses `listAttributeDefinitions` + `getAttributeDefinition` from `src/lib/attribute-definitions/api.ts` as-is.

### Roles & gating (verified `permissions.py`, same map as F9)

- **MODERATOR** — list/view + add/edit (holds `SERVICES_MODERATE`). **No delete.**
- **ADMIN / SUPERADMIN** — everything incl. delete (`PROVIDERS_RISK`).
- Page-level: backend 403 → fail-closed "requires higher role" state, not a crash.

### Mock backend (MSW) — required for e2e

- `src/mocks/category-bindings-store.ts` — in-memory store keyed by `(category_id, attribute_key)`; auto-increment `binding_id`; resolves `attribute_definition_id` + `is_system` from the attribute-definitions store; 404 on unknown category (categories store lookup) or unknown attribute key (definitions store lookup). PUT = create-or-replace with schema defaults for omitted fields (mirror full-upsert semantics). Seed `category-bindings-fixtures.ts`: 2–3 bindings on one seeded category (mixed flags, distinct `group_name`/`sort_order`), other seeded categories left unbound (empty-state coverage).
- Handlers in `src/mocks/handlers.ts` for the 3 routes. Path nesting note: register the bindings routes so they don't shadow / aren't shadowed by existing `/categories/:id` handlers (literal-before-param ordering rule from F9). Role gating from the JWT `role` claim: PUT requires any admin role, DELETE requires ADMIN+ (reuse role helper).

### Tests — `tests/`

- `category-bindings-list.spec.ts` — list renders seeded bindings with flag columns, empty-state on unbound category, unknown category 404 page, "Attributes" link navigates from category detail.
- `category-bindings-crud.spec.ts` — add flow (picker excludes already-bound keys → select def → form prefilled from definition descriptor → submit → row appears), edit (change `sort_order` + toggle a flag, **persistence verified after reload with a pending→Save button-text barrier** — F9 racy-test lesson), delete with confirm, invalid descriptor JSON → inline error.
- `category-bindings-guards.spec.ts` — MODERATOR (`mod@example.com`) can add/edit but sees no Delete; ADMIN (`ops@example.com`) + SUPERADMIN (`admin@example.com`) see Delete.

**Test isolation:** one shared in-memory store per `next start` (workers:1, no reset). Mutation tests create their OWN category + OWN attribute definition via the existing F8/F9 UI flows first, then bind those — never mutate fixtures other spec files assert on.

## Verification

- `pnpm lint` — clean.
- `pnpm build` with mock env (`NEXT_PUBLIC_USE_MOCK_AUTH=true NEXT_PUBLIC_USE_MOCK_BACKEND=true NEXT_PUBLIC_API_URL=http://127.0.0.1:65535`) — TS gate.
- `pnpm test:e2e` — full suite green (new specs + no regressions in categories/attr-defs specs that share stores).
- CI (`ci.yml`, ubuntu-latest) gates the PR; `deploy.yml` auto-deploys on merge to main.
- Live smoke at admin-marketplace.speakup.ltd as `shelp.dev@gmail.com` (SUPERADMIN) — user types the password.

## Pre-code gate

AGENTS.md: read the relevant Next 16 guide in `node_modules/next/dist/docs/` before writing code (App Router server actions / forms; React 19 `<form action>` reset). If absent, fall back to context7 Next.js.

## Out of scope (separate PRs)

Binding reorder via drag-and-drop (sort_order number input suffices), bulk bind/unbind, per-binding translations, MFA step-up UI (F12), >100 active definitions picker pagination.
