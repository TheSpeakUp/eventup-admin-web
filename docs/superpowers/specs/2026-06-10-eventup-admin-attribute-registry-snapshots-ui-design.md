# F13 — Attribute Registry Snapshots UI (design)

**Date:** 2026-06-10
**Repo:** `eventup-admin-web`
**Status:** design approved, pending spec review

Closes the EventUp Independent Admin CONTENT surface (backend slice C5 / PR #B1.7).
Mirrors the established F8/F9/F10 content-sub-domain template, but the **shape is a
read-only audit list + two action endpoints**, not a CRUD form. The nearest existing
analogue in this repo is the M6 audit log (`/audit`), which this design follows for the
list + detail read path.

## Backend contract (verified `eventup-backend` origin/main)

Three v2 endpoints under `/eventup-admin/v1/marketplace`, driven by
`registry_admin_views.py` + `attribute_registry_admin_schemas.py`:

1. **`GET /attribute-registry/snapshots`** — list, cursor-paginated, **query params**.
   - Filters: `attribute_key` (str ≤100), `category_id` (int ≥1), `entity_type` (str ≤64),
     `last_id` (int ≥1), `limit` (int 1–100, default 50).
   - Auth: `ADMIN_MARKETPLACE_READ` → **MODERATOR+** (read).
   - Response envelope: `{ items[], next_last_id, has_more, count }` (cursor, NOT offset/total).
   - Snapshot row (`MarketplaceAttributeRegistrySnapshotRead`):
     `id`, `entity_type`, `action`, `attribute_key`, `category_id?`,
     `attribute_definition_id?`, `binding_id?`, `before_state? (JSON)`,
     `after_state? (JSON)`, `actor_admin_id?`, `actor_display_name?`,
     `rollback_source_snapshot_id?`, `created_at` (datetime).

2. **`POST /attribute-registry/snapshots/{snapshot_id}/rollback`** — rollback one snapshot.
   - Auth: `ADMIN_MARKETPLACE_PROVIDERS_RISK` + step-up(RISK) → **ADMIN+** (step-up is a
     no-op today, see [[eventup-admin-content-endpoints-location]]).
   - Response: `MarketplaceAttributeRegistryRollbackResponse` =
     `{ success, message_key, message, snapshot }` (the new snapshot the rollback wrote;
     its `rollback_source_snapshot_id` points at the rolled-back one).

3. **`POST /attribute-revalidation/run`** — manual revalidation / backfill.
   - Auth: `ADMIN_MARKETPLACE_SERVICES_MODERATE` + step-up(MODERATE) → **MODERATOR+**.
   - Body (`MarketplaceAttributeRevalidationRunRequest`):
     `category_ids? (int[])`, `service_ids? (int[])`, `only_pending (bool, default true)`,
     `limit (int 1–5000, default 500)`, `source (str ≤64, default "admin_manual")`.
   - Response (`MarketplaceAttributeRevalidationRunResponse`):
     `{ processed_count, valid_count, invalid_count, pending_count }`.

**Gating summary (mirror, no new mechanism):**
| Action | Backend perm | UI role gate |
|---|---|---|
| List + view snapshot | READ | any admin (MODERATOR+) — no gate |
| Rollback | RISK | `role === "ADMIN" \|\| role === "SUPERADMIN"` (same as F9 delete) |
| Run revalidation | MODERATE | any admin (MODERATOR+) — no gate |

## Decisions (locked with user, 2026-06-10)

1. **Navigation** — top-level sidebar item (global scope, not a sub-route of F9).
2. **Scope** — all three endpoints in one PR (closes CONTENT surface; no deferred tail).
3. **Snapshot detail** — dedicated detail route with side-by-side before/after JSON +
   ADMIN-gated rollback action on that page.
4. **Revalidation form** — full field set (`category_ids`, `service_ids`, `only_pending`,
   `limit`, `source`).

## Architecture

Follows the repo's Server-Component-page + Server-Action + co-located client-component
pattern. New nav label: **"Registry"** at `/registry`.

### Routes

```
src/app/(routes)/registry/
  page.tsx                          # list: filters + snapshot table + cursor pagination + revalidation entry
  actions.ts                        # "use server" — rollbackSnapshotAction, runRevalidationAction
  action-types.ts                   # ActionState + EMPTY_STATE (mirror F9)
  _components/
    RegistrySnapshotsTable.tsx      # read-only table of snapshot rows
    RegistryFilters.tsx             # attribute_key / category_id / entity_type filter form (GET querystring)
    RegistryPagination.tsx          # cursor "Next" (last_id) — see pagination note
    RevalidationPanel.tsx           # "use client" — full revalidation form, useActionState, renders result counts
  snapshots/[id]/
    page.tsx                        # detail: metadata + before/after JSON, ADMIN-gated rollback
    _components/
      SnapshotView.tsx              # renders one snapshot (side-by-side before/after JSON via existing pretty-JSON edge render)
      RollbackButton.tsx            # "use client" — confirm() guard + useActionState (mirror DeleteAttributeDefinitionButton)
```

### Lib

```
src/lib/registry/
  types.ts   # RegistrySnapshot, RegistrySnapshotCursorPage, RegistrySnapshotListQuery,
             # RollbackResponse, RevalidationRunPayload, RevalidationRunResult
  api.ts     # listRegistrySnapshots(query), rollbackRegistrySnapshot(id), runRevalidation(payload)
             # BASE = "/eventup-admin/v1/marketplace"
```

- `listRegistrySnapshots` — GET with querystring built like `lib/audit/api.ts` (NOT a POST body
  filter; this endpoint takes query params).
- `rollbackRegistrySnapshot(id)` — POST `${BASE}/attribute-registry/snapshots/${id}/rollback`,
  `redirectOn401: false`.
- `runRevalidation(payload)` — POST `${BASE}/attribute-revalidation/run`, `redirectOn401: false`.

### Mocks (MSW)

```
src/mocks/registry-fixtures.ts   # seed snapshot rows covering create/update/delete/rollback actions,
                                 # multiple entity_types, with/without before/after, a rollback chain
src/mocks/registry-store.ts      # in-memory store: list(filter)→cursor page, get(id), rollback(id)→appends
                                 # a new snapshot row, runRevalidation(payload)→deterministic counts
```
Plus a `registry` handler slice appended to `src/mocks/handlers.ts` (route bases + the three
operations), following the attribute-definitions slice convention. Rollback in the mock
**appends a new snapshot** (so the list grows and the new row carries
`rollback_source_snapshot_id`), matching backend semantics — this is what the e2e asserts.

## Data flow

**List** — `page.tsx` reads `searchParams` (`attribute_key`, `category_id`, `entity_type`,
`last_id`), calls `listRegistrySnapshots`, renders filters + table + pagination. A 403 surfaces
a read-permission panel (mirror audit). Revalidation entry point lives on this page (panel,
collapsed/secondary — does not crowd the audit list).

**Detail** — `snapshots/[id]/page.tsx` fetches the snapshot (GET list is the only read path;
**there is no GET-by-id endpoint** — see open question below), reads session role in parallel,
renders `SnapshotView` (before/after JSON side-by-side) and, when `canRollback`, the
`RollbackButton`.

**Rollback** — `RollbackButton` form → `rollbackSnapshotAction(id)` → `rollbackRegistrySnapshot` →
on success `revalidatePath("/registry")` + redirect back to `/registry` (the new snapshot now
tops the list). `confirm()` guard before submit (mirror F9 delete). Reversible-ish (rollback is
itself recorded as a snapshot), but destructive enough to warrant the confirm.

**Revalidation** — `RevalidationPanel` (client) holds form fields in `useState`, server action
parses + validates (CSV → int[] for the id lists, range-checks `limit`), calls `runRevalidation`,
returns the four counts in `ActionState`; panel renders them. No redirect — stays on page so the
operator sees the result.

## Error handling

- All reads use the `apiFetch` `ApiFetchResult` envelope (`ok`/`status`/`message`/`data`).
- 403 on list/detail → permission panel ("Viewing registry snapshots requires the
  marketplace-read permission.").
- Rollback/revalidation failures → inline `ActionState.error` under the button/panel
  (`result.message ?? "Request failed (status)"`), never a thrown 500.
- CSV id parsing: reject non-integer tokens with a clear field error before calling the API.

## Testing (Playwright e2e, MSW-backed)

```
tests/registry-list.spec.ts        # list renders, filters narrow rows, cursor "Next" advances
tests/registry-detail.spec.ts      # detail shows before/after JSON; back link
tests/registry-rollback.spec.ts    # ADMIN sees+uses rollback → new snapshot appears, source id set;
                                   # MODERATOR does NOT see the rollback button (guard)
tests/registry-revalidation.spec.ts# panel submits full payload → result counts render;
                                   # invalid CSV id → field error, no API call
```
Gating tests mirror `categories-guards.spec.ts` / F9 guards: MODERATOR session hides the
rollback control; ADMIN/SUPERADMIN shows it.

## Open questions for implementation (resolve in plan, not blocking design)

1. **No GET-by-id snapshot endpoint.** The contract exposes only LIST + rollback + revalidation —
   there is no `GET /snapshots/{id}`. The detail route must therefore reconstruct the row from the
   list. **Plan decision:** the mock store gets an internal `get(id)`; the real `lib/api.ts`
   `getRegistrySnapshot(id)` fetches the list filtered as narrowly as possible and finds the row
   client-side (or, simpler and matching what's available: detail page calls list with `last_id`
   paging until the id is found, capped). Simplest correct option: **detail page lists snapshots
   (limit 100) and picks the matching id; if absent, 404.** Keep the `lib` surface honest about
   this — name it `findRegistrySnapshot(id)` and document that it's a list-and-filter, not a real
   GET. Revisit if backend later adds a by-id route.
2. **Cursor pagination is forward-only** (`next_last_id` / `has_more`) — same as F9. Provide
   "Next" only (no "Prev"), preserving active filters in the querystring (mirror F9 table
   pagination, not audit's offset pager).
3. **`entity_type` filter** — free-text input (backend takes an arbitrary str ≤64); do not hard-code
   an enum the contract doesn't define.

## Out of scope (YAGNI)

- No snapshot creation/edit UI — snapshots are written by backend mutations only.
- No GET-by-id backend change request — work within the three endpoints that exist.
- No diff-highlighting library — plain side-by-side pretty-printed JSON is enough for an audit
  surface (matches audit M6's metadata/details rendering).
- No bulk rollback, no scheduled revalidation — single-snapshot rollback + manual run only.

## Related

[[eventup-admin-attribute-definitions-ui-pr25]] (F9), [[eventup-admin-attr-translations-ui-pr32]]
(F10), [[eventup-admin-content-endpoints-location]] (backend location + gating),
[[eventup-admin-categories-ui-pr1]] (F8 template). M6 audit log (`/audit`) is the read-list
analogue.
