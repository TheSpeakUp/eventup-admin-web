# F13 — Attribute Registry Snapshots UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a read-only registry-snapshots audit surface at `/registry` with snapshot list + detail (side-by-side before/after JSON), ADMIN-gated single-snapshot rollback, and a MODERATOR+ manual revalidation form — closing the EventUp admin CONTENT surface (backend PR #B1.7).

**Architecture:** Server-Component pages + co-located Server Actions + MSW mock, verbatim-mirroring the F9 attribute-definitions and M6 audit-log patterns already in the repo. Read path mirrors `/audit` (no GET-by-id endpoint exists → detail reconstructs the row from a capped list call). Two action endpoints reuse the F9 `useActionState` + `confirm()` + `operatorRole` mock-gating mechanism. No new libraries.

**Tech Stack:** Next.js (App Router, Server Components, Server Actions), React 19, MSW (mock backend), Playwright (e2e), Tailwind.

**Spec:** `docs/superpowers/specs/2026-06-10-eventup-admin-attribute-registry-snapshots-ui-design.md`

---

## File Structure

**Create:**
- `src/lib/registry/types.ts` — DTOs + query/payload types.
- `src/lib/registry/api.ts` — `listRegistrySnapshots`, `findRegistrySnapshot`, `rollbackRegistrySnapshot`, `runRevalidation`.
- `src/mocks/registry-fixtures.ts` — seed snapshot rows.
- `src/mocks/registry-store.ts` — in-memory cursor store + rollback-append + revalidation counts.
- `src/app/(routes)/registry/action-types.ts` — `ActionState` variants + `EMPTY_STATE`.
- `src/app/(routes)/registry/actions.ts` — `rollbackSnapshotAction`, `runRevalidationAction`.
- `src/app/(routes)/registry/page.tsx` — list page.
- `src/app/(routes)/registry/_components/RegistryFilters.tsx` — filter form.
- `src/app/(routes)/registry/_components/RegistrySnapshotsTable.tsx` — read-only table.
- `src/app/(routes)/registry/_components/RegistryPagination.tsx` — forward-only cursor "Next".
- `src/app/(routes)/registry/_components/RevalidationPanel.tsx` — client revalidation form.
- `src/app/(routes)/registry/snapshots/[id]/page.tsx` — detail page.
- `src/app/(routes)/registry/snapshots/[id]/_components/SnapshotView.tsx` — before/after render.
- `src/app/(routes)/registry/snapshots/[id]/_components/RollbackButton.tsx` — client rollback button.
- `tests/registry-list.spec.ts`, `tests/registry-detail.spec.ts`, `tests/registry-rollback.spec.ts`, `tests/registry-revalidation.spec.ts`.

**Modify:**
- `src/mocks/handlers.ts` — add `REGISTRY_BASE` constant + 3 registry handlers (imports + handler slice).
- `src/app/(routes)/layout.tsx:6-22` — add `{ href: "/registry", label: "Registry" }` nav item.

---

## Task 1: Registry lib types

**Files:**
- Create: `src/lib/registry/types.ts`

- [ ] **Step 1: Write the types file**

```typescript
// Mirrors eventup-backend origin/main
// src/eventup/admin/marketplace/attribute_registry_admin_schemas.py
// (MarketplaceAttributeRegistrySnapshot* + Revalidation* models).
//
// Snapshots are a READ-ONLY audit/rollback log. The list is cursor-paginated
// (next_last_id / has_more, id DESC — newest first), NOT offset/total. There is
// NO GET-by-id endpoint: the detail view reconstructs a row from a capped list
// (see lib/registry/api.ts findRegistrySnapshot).

// Free-form JSON blobs captured before/after a registry mutation.
export type RegistryStateDoc = Record<string, unknown>;

export type RegistrySnapshot = {
  id: number;
  entity_type: string;
  action: string;
  attribute_key: string;
  category_id: number | null;
  attribute_definition_id: number | null;
  binding_id: number | null;
  before_state: RegistryStateDoc | null;
  after_state: RegistryStateDoc | null;
  actor_admin_id: string | null;
  actor_display_name: string | null;
  rollback_source_snapshot_id: number | null;
  created_at: string;
};

export type RegistrySnapshotCursorPage = {
  items: RegistrySnapshot[];
  next_last_id: number | null;
  has_more: boolean;
  count: number;
};

export type RegistrySnapshotListQuery = {
  attribute_key?: string;
  category_id?: number;
  entity_type?: string;
  last_id?: number;
  limit?: number;
};

// POST .../rollback response. `snapshot` is the NEW snapshot the rollback wrote;
// its rollback_source_snapshot_id points at the snapshot that was rolled back.
export type RollbackResponse = {
  success: boolean;
  message_key: string;
  message: string;
  snapshot: RegistrySnapshot;
};

// POST /attribute-revalidation/run body. Omitted id lists = no targeting filter.
export type RevalidationRunPayload = {
  category_ids?: number[];
  service_ids?: number[];
  only_pending: boolean;
  limit: number;
  source: string;
};

export type RevalidationRunResult = {
  processed_count: number;
  valid_count: number;
  invalid_count: number;
  pending_count: number;
};
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS (no errors referencing `src/lib/registry/types.ts`).

- [ ] **Step 3: Commit**

```bash
git add src/lib/registry/types.ts
git commit -m "feat(registry): F13 lib types for snapshots + revalidation"
```

---

## Task 2: Registry lib API client

**Files:**
- Create: `src/lib/registry/api.ts`

- [ ] **Step 1: Write the API client**

```typescript
import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  RegistrySnapshot,
  RegistrySnapshotCursorPage,
  RegistrySnapshotListQuery,
  RevalidationRunPayload,
  RevalidationRunResult,
  RollbackResponse,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace";

// Snapshot list is a GET with querystring filters (NOT a POST body filter —
// unlike attribute-definitions). Build the query like lib/audit/api.ts.
function buildListPath(query: RegistrySnapshotListQuery): string {
  const params = new URLSearchParams();
  if (query.attribute_key) params.set("attribute_key", query.attribute_key);
  if (query.category_id !== undefined)
    params.set("category_id", String(query.category_id));
  if (query.entity_type) params.set("entity_type", query.entity_type);
  if (query.last_id !== undefined) params.set("last_id", String(query.last_id));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  const qs = params.toString();
  const path = `${BASE}/attribute-registry/snapshots`;
  return qs ? `${path}?${qs}` : path;
}

export function listRegistrySnapshots(
  query: RegistrySnapshotListQuery = {},
): Promise<ApiFetchResult<RegistrySnapshotCursorPage>> {
  return apiFetch<RegistrySnapshotCursorPage>(buildListPath(query));
}

// There is NO GET /snapshots/{id}. The detail page reconstructs the row by
// listing (newest-first, capped at 100) and matching the id. Returns null if
// the id is absent from that window — the page then renders notFound().
export async function findRegistrySnapshot(
  id: number,
): Promise<
  | { ok: true; snapshot: RegistrySnapshot | null }
  | { ok: false; status: number; message: string }
> {
  const res = await listRegistrySnapshots({ limit: 100 });
  if (!res.ok) return { ok: false, status: res.status, message: res.message };
  const snapshot = res.data.items.find((s) => s.id === id) ?? null;
  return { ok: true, snapshot };
}

export function rollbackRegistrySnapshot(
  id: number,
): Promise<ApiFetchResult<RollbackResponse>> {
  return apiFetch<RollbackResponse>(
    `${BASE}/attribute-registry/snapshots/${id}/rollback`,
    { method: "POST", redirectOn401: false },
  );
}

export function runRevalidation(
  payload: RevalidationRunPayload,
): Promise<ApiFetchResult<RevalidationRunResult>> {
  return apiFetch<RevalidationRunResult>(
    `${BASE}/attribute-revalidation/run`,
    { method: "POST", body: JSON.stringify(payload), redirectOn401: false },
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/registry/api.ts
git commit -m "feat(registry): F13 lib API client (list/find/rollback/revalidate)"
```

---

## Task 3: Mock fixtures + store

**Files:**
- Create: `src/mocks/registry-fixtures.ts`
- Create: `src/mocks/registry-store.ts`

- [ ] **Step 1: Write the fixtures**

```typescript
import type { RegistrySnapshot } from "@/lib/registry/types";

// Seed a spread of snapshot rows covering create/update/delete/rollback actions,
// several entity_types, with and without before/after state, and one row that is
// itself the product of a rollback (rollback_source_snapshot_id set). Ids are
// monotonic; the store treats the highest id as newest.
export function buildFixtureRegistrySnapshots(): RegistrySnapshot[] {
  return [
    {
      id: 1001,
      entity_type: "attribute_definition",
      action: "create",
      attribute_key: "cuisine",
      category_id: null,
      attribute_definition_id: 11,
      binding_id: null,
      before_state: null,
      after_state: { key: "cuisine", group_name: "food", is_active: true },
      actor_admin_id: "admin-1",
      actor_display_name: "moderator@eventup.test",
      rollback_source_snapshot_id: null,
      created_at: "2026-06-09T08:00:00",
    },
    {
      id: 1002,
      entity_type: "attribute_definition",
      action: "update",
      attribute_key: "cuisine",
      category_id: null,
      attribute_definition_id: 11,
      binding_id: null,
      before_state: { sort_order: 100, is_active: true },
      after_state: { sort_order: 50, is_active: true },
      actor_admin_id: "admin-1",
      actor_display_name: "moderator@eventup.test",
      rollback_source_snapshot_id: null,
      created_at: "2026-06-09T09:30:00",
    },
    {
      id: 1003,
      entity_type: "category_binding",
      action: "create",
      attribute_key: "capacity",
      category_id: 7,
      attribute_definition_id: 12,
      binding_id: 305,
      before_state: null,
      after_state: { is_visible_in_filters: true, sort_order: 100 },
      actor_admin_id: "admin-2",
      actor_display_name: "admin@eventup.test",
      rollback_source_snapshot_id: null,
      created_at: "2026-06-09T11:15:00",
    },
    {
      id: 1004,
      entity_type: "attribute_definition",
      action: "delete",
      attribute_key: "legacy_tag",
      category_id: null,
      attribute_definition_id: 9,
      binding_id: null,
      before_state: { key: "legacy_tag", is_active: false },
      after_state: null,
      actor_admin_id: "admin-2",
      actor_display_name: "admin@eventup.test",
      rollback_source_snapshot_id: null,
      created_at: "2026-06-10T07:45:00",
    },
    {
      id: 1005,
      entity_type: "attribute_definition",
      action: "rollback",
      attribute_key: "cuisine",
      category_id: null,
      attribute_definition_id: 11,
      binding_id: null,
      before_state: { sort_order: 50 },
      after_state: { sort_order: 100 },
      actor_admin_id: "admin-2",
      actor_display_name: "admin@eventup.test",
      rollback_source_snapshot_id: 1002,
      created_at: "2026-06-10T10:00:00",
    },
  ];
}
```

- [ ] **Step 2: Write the store**

```typescript
import type {
  RegistrySnapshot,
  RegistrySnapshotCursorPage,
  RegistrySnapshotListQuery,
  RevalidationRunPayload,
  RevalidationRunResult,
  RollbackResponse,
} from "@/lib/registry/types";
import { buildFixtureRegistrySnapshots } from "./registry-fixtures";

const snapshots = new Map<number, RegistrySnapshot>();
let nextId = 0;

function ensureSeed(): void {
  if (snapshots.size > 0) return;
  for (const s of buildFixtureRegistrySnapshots()) snapshots.set(s.id, s);
  nextId = Math.max(...snapshots.keys()) + 1;
}

// Convention parity with the other stores (not wired to any endpoint today).
export function resetRegistrySnapshotsStore(): void {
  snapshots.clear();
  nextId = 0;
  ensureSeed();
}

export function getRegistrySnapshotById(id: number): RegistrySnapshot | null {
  ensureSeed();
  return snapshots.get(id) ?? null;
}

// Cursor list: rows ordered id DESC (newest first). `last_id` excludes ids >=
// last_id (loads the next OLDER page). next_last_id = smallest id on the page;
// has_more = older rows remain below it.
export function listRegistrySnapshotsPage(
  query: RegistrySnapshotListQuery,
): RegistrySnapshotCursorPage {
  ensureSeed();
  let rows = Array.from(snapshots.values()).sort((a, b) => b.id - a.id);

  if (query.attribute_key) {
    const needle = query.attribute_key.toLowerCase();
    rows = rows.filter((r) => r.attribute_key.toLowerCase().includes(needle));
  }
  if (query.category_id !== undefined)
    rows = rows.filter((r) => r.category_id === query.category_id);
  if (query.entity_type) {
    const needle = query.entity_type.toLowerCase();
    rows = rows.filter((r) => r.entity_type.toLowerCase().includes(needle));
  }
  if (query.last_id !== undefined)
    rows = rows.filter((r) => r.id < query.last_id!);

  const limit = Math.max(1, Math.min(100, query.limit ?? 50));
  const page = rows.slice(0, limit);
  const hasMore = rows.length > limit;
  const nextLastId = page.length > 0 ? page[page.length - 1].id : null;
  return {
    items: page,
    next_last_id: hasMore ? nextLastId : null,
    has_more: hasMore,
    count: page.length,
  };
}

// Rollback APPENDS a new snapshot (action "rollback") whose
// rollback_source_snapshot_id points at the source. Mirrors backend semantics so
// the list grows and e2e can assert the new row. Returns null if id is unknown.
export function rollbackRegistrySnapshotRecord(
  id: number,
  actor: { admin_id: string | null; display_name: string | null },
): RollbackResponse | null {
  ensureSeed();
  const source = snapshots.get(id);
  if (!source) return null;
  const created: RegistrySnapshot = {
    id: nextId++,
    entity_type: source.entity_type,
    action: "rollback",
    attribute_key: source.attribute_key,
    category_id: source.category_id,
    attribute_definition_id: source.attribute_definition_id,
    binding_id: source.binding_id,
    // The rollback reverses the source mutation: new before = source.after,
    // new after = source.before.
    before_state: source.after_state,
    after_state: source.before_state,
    actor_admin_id: actor.admin_id,
    actor_display_name: actor.display_name,
    rollback_source_snapshot_id: source.id,
    created_at: "2026-06-10T12:00:00",
  };
  snapshots.set(created.id, created);
  return {
    success: true,
    message_key: "core.success.updated",
    message: "Registry snapshot rolled back successfully",
    snapshot: created,
  };
}

// Deterministic counts derived from the payload so e2e is stable. `only_pending`
// halves the processed set; an explicit category/service target shrinks it
// further. Pure function of the payload — no store mutation.
export function runRevalidationRecord(
  payload: RevalidationRunPayload,
): RevalidationRunResult {
  const targeted =
    (payload.category_ids?.length ?? 0) + (payload.service_ids?.length ?? 0);
  const base = targeted > 0 ? targeted * 3 : payload.only_pending ? 12 : 24;
  const processed = Math.min(base, payload.limit);
  const invalid = Math.floor(processed / 6);
  const valid = processed - invalid;
  const pending = payload.only_pending ? 0 : Math.floor(processed / 4);
  return {
    processed_count: processed,
    valid_count: valid,
    invalid_count: invalid,
    pending_count: pending,
  };
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/mocks/registry-fixtures.ts src/mocks/registry-store.ts
git commit -m "feat(registry): F13 mock fixtures + cursor store (rollback append, revalidation counts)"
```

---

## Task 4: Wire registry handlers into MSW

**Files:**
- Modify: `src/mocks/handlers.ts`

- [ ] **Step 1: Add the store imports**

After the audit-store import block (`import { getAuditEventById, listAuditEventsPage } from "./audit-store";`, currently line 134) add:

```typescript
import {
  getRegistrySnapshotById,
  listRegistrySnapshotsPage,
  rollbackRegistrySnapshotRecord,
  runRevalidationRecord,
} from "./registry-store";
import type { RevalidationRunPayload } from "@/lib/registry/types";
```

- [ ] **Step 2: Add the base constant**

After `const AUDIT_BASE = buildApiUrl("/eventup-admin/v1/audit");` (line 161) add:

```typescript
const REGISTRY_BASE = buildApiUrl("/eventup-admin/v1/marketplace");
```

- [ ] **Step 3: Add the handler slice**

Inside the `handlers` array, immediately before the audit slice comment
(`// ---- Unified audit log (M6, READ-ONLY) ----`, currently line 1917) insert:

```typescript
  // ---- Attribute registry snapshots + revalidation (F13) ----------------
  // List is GET with querystring filters (attribute_key / category_id /
  // entity_type) + cursor (last_id / limit). Rollback is ADMIN-gated (RISK);
  // revalidation is MODERATOR+ (any authenticated admin in the mock).
  http.get(`${REGISTRY_BASE}/attribute-registry/snapshots`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      listRegistrySnapshotsPage({
        attribute_key: queryStr(url.searchParams.get("attribute_key")),
        category_id: queryNum(url.searchParams.get("category_id")),
        entity_type: queryStr(url.searchParams.get("entity_type")),
        last_id: queryNum(url.searchParams.get("last_id")),
        limit: queryNum(url.searchParams.get("limit")),
      }),
    );
  }),
  http.post(
    `${REGISTRY_BASE}/attribute-registry/snapshots/:id/rollback`,
    ({ params, request }) => {
      const role = operatorRole(request);
      if (role !== "ADMIN" && role !== "SUPERADMIN") {
        return HttpResponse.json(
          {
            error: {
              message: "forbidden",
              meta: { original_detail: "Requires ADMIN role" },
            },
          },
          { status: 403 },
        );
      }
      const id = Number(params.id);
      if (!Number.isInteger(id))
        return HttpResponse.json({ detail: "Not found" }, { status: 404 });
      const result = rollbackRegistrySnapshotRecord(id, {
        admin_id: operatorSub(request),
        display_name: operatorSub(request),
      });
      if (!result)
        return HttpResponse.json({ detail: "Not found" }, { status: 404 });
      return HttpResponse.json(result);
    },
  ),
  http.post(
    `${REGISTRY_BASE}/attribute-revalidation/run`,
    async ({ request }) => {
      const body = (await request.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      const payload: RevalidationRunPayload = {
        category_ids: Array.isArray(body.category_ids)
          ? (body.category_ids as number[])
          : undefined,
        service_ids: Array.isArray(body.service_ids)
          ? (body.service_ids as number[])
          : undefined,
        only_pending: body.only_pending !== false,
        limit:
          typeof body.limit === "number" && Number.isFinite(body.limit)
            ? body.limit
            : 500,
        source: typeof body.source === "string" ? body.source : "admin_manual",
      };
      return HttpResponse.json(runRevalidationRecord(payload));
    },
  ),
```

Note: `getRegistrySnapshotById` is imported for parity with other stores but the
list endpoint is the only registry read the UI calls; leaving it unused would trip
lint. Reference it in the rollback 404 guard is unnecessary — instead DO NOT
import it. **Correction:** drop `getRegistrySnapshotById` from the Step-1 import so
there is no unused symbol. Final Step-1 import block:

```typescript
import {
  listRegistrySnapshotsPage,
  rollbackRegistrySnapshotRecord,
  runRevalidationRecord,
} from "./registry-store";
import type { RevalidationRunPayload } from "@/lib/registry/types";
```

- [ ] **Step 4: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS, no unused-symbol warnings for the registry imports.

- [ ] **Step 5: Commit**

```bash
git add src/mocks/handlers.ts
git commit -m "feat(registry): F13 MSW handlers (list/rollback/revalidate)"
```

---

## Task 5: Action types + server actions

**Files:**
- Create: `src/app/(routes)/registry/action-types.ts`
- Create: `src/app/(routes)/registry/actions.ts`

- [ ] **Step 1: Write action-types.ts**

```typescript
// Rollback uses the F9 ok/error shape. Revalidation success carries the result
// counts so the panel can render them, so it has a richer success variant.
import type { RevalidationRunResult } from "@/lib/registry/types";

export type RollbackState =
  | { ok: true; error: null }
  | { ok: false; error: string };
export const EMPTY_ROLLBACK_STATE: RollbackState = { ok: true, error: null };

export type RevalidationState =
  | { ok: true; result: RevalidationRunResult }
  | { ok: false; error: string }
  | { ok: null }; // initial — nothing submitted yet
export const EMPTY_REVALIDATION_STATE: RevalidationState = { ok: null };
```

- [ ] **Step 2: Write actions.ts**

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  rollbackRegistrySnapshot,
  runRevalidation,
} from "@/lib/registry/api";
import type { RevalidationRunPayload } from "@/lib/registry/types";
import type { RevalidationState, RollbackState } from "./action-types";

// Parse a comma/space-separated list of positive integers. Empty → undefined
// (omit the filter). A non-integer token → error string.
function parseIdList(
  raw: FormDataEntryValue | null,
): { ok: true; ids: number[] | undefined } | { ok: false; error: string } {
  if (typeof raw !== "string" || raw.trim() === "")
    return { ok: true, ids: undefined };
  const tokens = raw.split(/[\s,]+/).filter((t) => t !== "");
  const ids: number[] = [];
  for (const t of tokens) {
    const n = Number(t);
    if (!Number.isInteger(n) || n < 1)
      return { ok: false, error: `Invalid id: "${t}" (positive integers only)` };
    ids.push(n);
  }
  return { ok: true, ids };
}

export async function rollbackSnapshotAction(
  _prev: RollbackState,
  formData: FormData,
): Promise<RollbackState> {
  const raw = formData.get("snapshot_id");
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1)
    return { ok: false, error: "Invalid snapshot id" };
  const result = await rollbackRegistrySnapshot(id);
  if (!result.ok)
    return {
      ok: false,
      error: result.message ?? `Request failed (${result.status})`,
    };
  revalidatePath("/registry");
  redirect("/registry");
}

export async function runRevalidationAction(
  _prev: RevalidationState,
  formData: FormData,
): Promise<RevalidationState> {
  const categories = parseIdList(formData.get("category_ids"));
  if (!categories.ok) return { ok: false, error: categories.error };
  const services = parseIdList(formData.get("service_ids"));
  if (!services.ok) return { ok: false, error: services.error };

  const limitRaw = formData.get("limit");
  const limit = Number(limitRaw);
  if (!Number.isInteger(limit) || limit < 1 || limit > 5000)
    return { ok: false, error: "Limit must be an integer 1–5000" };

  const sourceRaw = formData.get("source");
  const source =
    typeof sourceRaw === "string" && sourceRaw.trim() !== ""
      ? sourceRaw.trim()
      : "admin_manual";
  if (source.length > 64)
    return { ok: false, error: "Source must be at most 64 characters" };

  // Hidden "true"/"false" sentinel + checkbox "true" (F9 bool pattern).
  const onlyPending = formData.getAll("only_pending").includes("true");

  const payload: RevalidationRunPayload = {
    category_ids: categories.ids,
    service_ids: services.ids,
    only_pending: onlyPending,
    limit,
    source,
  };
  const result = await runRevalidation(payload);
  if (!result.ok)
    return {
      ok: false,
      error: result.message ?? `Request failed (${result.status})`,
    };
  return { ok: true, result: result.data };
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(routes\)/registry/action-types.ts src/app/\(routes\)/registry/actions.ts
git commit -m "feat(registry): F13 action-types + rollback/revalidation server actions"
```

---

## Task 6: List page + table + filters + pagination

**Files:**
- Create: `src/app/(routes)/registry/_components/RegistrySnapshotsTable.tsx`
- Create: `src/app/(routes)/registry/_components/RegistryFilters.tsx`
- Create: `src/app/(routes)/registry/_components/RegistryPagination.tsx`
- Create: `src/app/(routes)/registry/page.tsx`

- [ ] **Step 1: Write RegistrySnapshotsTable.tsx**

```tsx
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import type { RegistrySnapshot } from "@/lib/registry/types";

export function RegistrySnapshotsTable({
  rows,
}: {
  rows: RegistrySnapshot[];
}) {
  if (rows.length === 0) {
    return (
      <p
        data-testid="registry-empty"
        className="rounded border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500"
      >
        No registry snapshots match the current filters.
      </p>
    );
  }
  return (
    <table
      data-testid="registry-table"
      className="w-full border-collapse text-sm"
    >
      <thead>
        <tr className="border-b border-zinc-200 text-left text-zinc-500">
          <th className="py-2 pr-4">ID</th>
          <th className="py-2 pr-4">Entity</th>
          <th className="py-2 pr-4">Action</th>
          <th className="py-2 pr-4">Attribute key</th>
          <th className="py-2 pr-4">Actor</th>
          <th className="py-2 pr-4">When</th>
          <th className="py-2 pr-4"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.id}
            data-testid="registry-row"
            data-snapshot-id={r.id}
            className="border-b border-zinc-100"
          >
            <td className="py-2 pr-4 font-mono text-xs">{r.id}</td>
            <td className="py-2 pr-4">{r.entity_type}</td>
            <td className="py-2 pr-4">{r.action}</td>
            <td className="py-2 pr-4 font-mono text-xs">{r.attribute_key}</td>
            <td className="py-2 pr-4 text-zinc-600">
              {r.actor_display_name ?? "—"}
            </td>
            <td className="py-2 pr-4 text-zinc-500">
              {formatDateTime(r.created_at)}
            </td>
            <td className="py-2 pr-4">
              <Link
                href={`/registry/snapshots/${r.id}`}
                data-testid="registry-row-view"
                className="text-blue-700 hover:underline"
              >
                View
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 2: Write RegistryFilters.tsx**

```tsx
// Plain GET form — submitting sets the querystring and re-renders the server
// page. entity_type is free text (backend accepts an arbitrary str ≤64); do not
// constrain it to an enum the contract does not define.
export default function RegistryFilters({
  attributeKey,
  categoryId,
  entityType,
}: {
  attributeKey?: string;
  categoryId?: string;
  entityType?: string;
}) {
  return (
    <form
      action="/registry"
      role="search"
      data-testid="registry-filters"
      className="flex flex-wrap items-end gap-3"
    >
      <label className="flex flex-col text-xs text-zinc-500">
        Attribute key
        <input
          type="text"
          name="attribute_key"
          defaultValue={attributeKey ?? ""}
          data-testid="registry-filter-attribute-key"
          className="mt-1 w-48 rounded border border-zinc-200 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col text-xs text-zinc-500">
        Category id
        <input
          type="number"
          name="category_id"
          min={1}
          defaultValue={categoryId ?? ""}
          data-testid="registry-filter-category-id"
          className="mt-1 w-32 rounded border border-zinc-200 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col text-xs text-zinc-500">
        Entity type
        <input
          type="text"
          name="entity_type"
          defaultValue={entityType ?? ""}
          data-testid="registry-filter-entity-type"
          className="mt-1 w-48 rounded border border-zinc-200 px-2 py-1 text-sm"
        />
      </label>
      <button
        type="submit"
        data-testid="registry-filter-apply"
        className="rounded bg-zinc-900 px-4 py-1.5 text-sm text-white"
      >
        Apply
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Write RegistryPagination.tsx**

```tsx
import Link from "next/link";

// Forward-only cursor (the backend exposes next_last_id / has_more, no "prev").
// "Next" carries last_id=next_last_id and preserves active filters.
export default function RegistryPagination({
  nextLastId,
  hasMore,
  filters,
}: {
  nextLastId: number | null;
  hasMore: boolean;
  filters: { attribute_key?: string; category_id?: string; entity_type?: string };
}) {
  if (!hasMore || nextLastId === null) return null;
  const params = new URLSearchParams();
  if (filters.attribute_key) params.set("attribute_key", filters.attribute_key);
  if (filters.category_id) params.set("category_id", filters.category_id);
  if (filters.entity_type) params.set("entity_type", filters.entity_type);
  params.set("last_id", String(nextLastId));
  return (
    <Link
      href={`/registry?${params.toString()}`}
      data-testid="registry-next"
      className="inline-block rounded border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
    >
      Next →
    </Link>
  );
}
```

- [ ] **Step 4: Write page.tsx**

```tsx
// Read-only registry snapshots audit list (F13). Cursor-paginated against
// GET /eventup-admin/v1/marketplace/attribute-registry/snapshots. Filters
// (attribute_key / category_id / entity_type) ride the querystring; a 403
// surfaces the read-permission panel. The revalidation panel lives at the
// bottom — running it requires MODERATOR+ (any authenticated admin).
import { listRegistrySnapshots } from "@/lib/registry/api";
import RegistryFilters from "./_components/RegistryFilters";
import RegistryPagination from "./_components/RegistryPagination";
import { RegistrySnapshotsTable } from "./_components/RegistrySnapshotsTable";
import RevalidationPanel from "./_components/RevalidationPanel";

const LIMIT = 50;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function pickPositiveInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : undefined;
}

export default async function RegistryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const attributeKey = pickString(sp.attribute_key)?.trim() || undefined;
  const entityType = pickString(sp.entity_type)?.trim() || undefined;
  const categoryIdRaw = pickString(sp.category_id)?.trim() || undefined;
  const categoryId = pickPositiveInt(categoryIdRaw);
  const lastId = pickPositiveInt(pickString(sp.last_id));

  const result = await listRegistrySnapshots({
    attribute_key: attributeKey,
    category_id: categoryId,
    entity_type: entityType,
    last_id: lastId,
    limit: LIMIT,
  });

  if (!result.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Registry</h1>
        <div
          data-testid="registry-error"
          className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {result.status === 403
            ? "Viewing registry snapshots requires the marketplace-read permission."
            : `Failed to load registry snapshots: ${result.message}`}
        </div>
      </div>
    );
  }

  const { items, next_last_id, has_more } = result.data;
  const filters = {
    attribute_key: attributeKey,
    category_id: categoryIdRaw,
    entity_type: entityType,
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Registry snapshots</h1>
      <RegistryFilters
        attributeKey={attributeKey}
        categoryId={categoryIdRaw}
        entityType={entityType}
      />
      <RegistrySnapshotsTable rows={items} />
      <RegistryPagination
        nextLastId={next_last_id}
        hasMore={has_more}
        filters={filters}
      />
      <RevalidationPanel />
    </div>
  );
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS (RevalidationPanel is imported here and created in Task 7 — if running Task 6 alone, temporarily expect a missing-module error resolved by Task 7; do not commit until Task 7 lands).

- [ ] **Step 6: Commit (after Task 7 so the import resolves)**

Defer the commit for the list page to the end of Task 7.

---

## Task 7: Revalidation panel (client)

**Files:**
- Create: `src/app/(routes)/registry/_components/RevalidationPanel.tsx`

- [ ] **Step 1: Write RevalidationPanel.tsx**

```tsx
"use client";
import { useActionState } from "react";
import { runRevalidationAction } from "../actions";
import { EMPTY_REVALIDATION_STATE } from "../action-types";

export default function RevalidationPanel() {
  const [state, formAction, pending] = useActionState(
    runRevalidationAction,
    EMPTY_REVALIDATION_STATE,
  );
  return (
    <section
      data-testid="revalidation-panel"
      className="rounded-md border border-zinc-200 bg-white p-5"
    >
      <h2 className="text-lg font-semibold">Run attribute revalidation</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Manually revalidate / backfill marketplace attribute data. Leave the id
        lists empty to run unscoped.
      </p>
      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs text-zinc-500">
          Category ids (comma-separated)
          <input
            type="text"
            name="category_ids"
            placeholder="e.g. 7, 12"
            data-testid="revalidation-category-ids"
            className="mt-1 w-48 rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col text-xs text-zinc-500">
          Service ids (comma-separated)
          <input
            type="text"
            name="service_ids"
            placeholder="e.g. 101, 102"
            data-testid="revalidation-service-ids"
            className="mt-1 w-48 rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col text-xs text-zinc-500">
          Limit
          <input
            type="number"
            name="limit"
            min={1}
            max={5000}
            defaultValue={500}
            data-testid="revalidation-limit"
            className="mt-1 w-28 rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col text-xs text-zinc-500">
          Source
          <input
            type="text"
            name="source"
            defaultValue="admin_manual"
            maxLength={64}
            data-testid="revalidation-source"
            className="mt-1 w-40 rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          {/* hidden sentinel + checkbox = F9 bool pattern */}
          <input type="hidden" name="only_pending" value="false" />
          <input
            type="checkbox"
            name="only_pending"
            value="true"
            defaultChecked
            data-testid="revalidation-only-pending"
          />
          Only pending
        </label>
        <button
          type="submit"
          disabled={pending}
          data-testid="revalidation-run"
          className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Running…" : "Run revalidation"}
        </button>
      </form>
      {state.ok === false ? (
        <p
          data-testid="revalidation-error"
          className="mt-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}
      {state.ok === true ? (
        <dl
          data-testid="revalidation-result"
          className="mt-4 grid grid-cols-4 gap-3 text-sm"
        >
          <div>
            <dt className="text-zinc-500">Processed</dt>
            <dd
              data-testid="revalidation-processed"
              className="font-semibold"
            >
              {state.result.processed_count}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Valid</dt>
            <dd className="font-semibold">{state.result.valid_count}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Invalid</dt>
            <dd className="font-semibold">{state.result.invalid_count}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Pending</dt>
            <dd className="font-semibold">{state.result.pending_count}</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 2: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS (the Task 6 list-page import now resolves).

- [ ] **Step 3: Commit (list page + panel together)**

```bash
git add src/app/\(routes\)/registry/page.tsx src/app/\(routes\)/registry/_components/
git commit -m "feat(registry): F13 snapshots list page + filters/table/pagination + revalidation panel"
```

---

## Task 8: Detail page + snapshot view + rollback button

**Files:**
- Create: `src/app/(routes)/registry/snapshots/[id]/_components/SnapshotView.tsx`
- Create: `src/app/(routes)/registry/snapshots/[id]/_components/RollbackButton.tsx`
- Create: `src/app/(routes)/registry/snapshots/[id]/page.tsx`

- [ ] **Step 1: Write SnapshotView.tsx**

```tsx
import { formatDateTime } from "@/lib/format";
import type { RegistrySnapshot } from "@/lib/registry/types";

function JsonBlock({
  label,
  value,
  testid,
}: {
  label: string;
  value: Record<string, unknown> | null;
  testid: string;
}) {
  return (
    <div className="flex-1">
      <h3 className="text-sm font-medium text-zinc-600">{label}</h3>
      <pre
        data-testid={testid}
        className="mt-1 overflow-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-xs"
      >
        {value === null ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export function SnapshotView({ snapshot }: { snapshot: RegistrySnapshot }) {
  return (
    <div className="space-y-5">
      <dl
        data-testid="snapshot-meta"
        className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm md:grid-cols-3"
      >
        <div>
          <dt className="text-zinc-500">Entity type</dt>
          <dd>{snapshot.entity_type}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Action</dt>
          <dd data-testid="snapshot-action">{snapshot.action}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Attribute key</dt>
          <dd className="font-mono text-xs">{snapshot.attribute_key}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Category id</dt>
          <dd>{snapshot.category_id ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Binding id</dt>
          <dd>{snapshot.binding_id ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Actor</dt>
          <dd>{snapshot.actor_display_name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">When</dt>
          <dd>{formatDateTime(snapshot.created_at)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Rollback source</dt>
          <dd data-testid="snapshot-rollback-source">
            {snapshot.rollback_source_snapshot_id ?? "—"}
          </dd>
        </div>
      </dl>
      <div className="flex flex-col gap-4 md:flex-row">
        <JsonBlock
          label="Before"
          value={snapshot.before_state}
          testid="snapshot-before"
        />
        <JsonBlock
          label="After"
          value={snapshot.after_state}
          testid="snapshot-after"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write RollbackButton.tsx**

```tsx
"use client";
import { useActionState } from "react";
import { rollbackSnapshotAction } from "../../../actions";
import { EMPTY_ROLLBACK_STATE } from "../../../action-types";

export function RollbackButton({ snapshotId }: { snapshotId: number }) {
  const [state, formAction, pending] = useActionState(
    rollbackSnapshotAction,
    EMPTY_ROLLBACK_STATE,
  );
  return (
    <form
      action={formAction}
      data-testid="snapshot-rollback-form"
      onSubmit={(e) => {
        if (
          !confirm(
            "Roll back this snapshot? A new rollback snapshot will be recorded.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="snapshot_id" value={snapshotId} />
      <button
        type="submit"
        disabled={pending}
        data-testid="snapshot-rollback"
        className="rounded border border-amber-400 px-4 py-2 text-amber-700 disabled:opacity-50"
      >
        {pending ? "Rolling back…" : "Roll back this snapshot"}
      </button>
      {state && !state.ok && state.error ? (
        <p
          data-testid="snapshot-rollback-error"
          className="mt-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
```

- [ ] **Step 3: Write page.tsx**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { findRegistrySnapshot } from "@/lib/registry/api";
import { getAdminSession } from "@/lib/auth/session";
import { SnapshotView } from "./_components/SnapshotView";
import { RollbackButton } from "./_components/RollbackButton";

// Read-only registry snapshot detail (F13). There is NO GET-by-id endpoint —
// the row is reconstructed from a capped list (findRegistrySnapshot). Rollback
// requires ADMIN_MARKETPLACE_PROVIDERS_RISK → ADMIN or SUPERADMIN.
export default async function RegistrySnapshotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) notFound();

  const [found, session] = await Promise.all([
    findRegistrySnapshot(numericId),
    getAdminSession(),
  ]);

  if (!found.ok) {
    return (
      <div className="p-8">
        <Link
          href="/registry"
          className="text-sm text-zinc-500 hover:underline"
        >
          ← Back to registry
        </Link>
        <div
          data-testid="snapshot-detail-error"
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {found.status === 403
            ? "Viewing registry snapshots requires the marketplace-read permission."
            : `Failed to load registry snapshot: ${found.message}`}
        </div>
      </div>
    );
  }
  if (!found.snapshot) notFound();

  const snapshot = found.snapshot;
  const canRollback =
    session?.role === "ADMIN" || session?.role === "SUPERADMIN";

  return (
    <div className="p-8 space-y-6">
      <Link href="/registry" className="text-sm text-zinc-500 hover:underline">
        ← Back to registry
      </Link>
      <h1
        className="text-2xl font-semibold"
        data-testid="snapshot-detail-id"
      >
        Snapshot #{snapshot.id}
      </h1>
      <SnapshotView snapshot={snapshot} />
      {canRollback ? <RollbackButton snapshotId={snapshot.id} /> : null}
    </div>
  );
}
```

- [ ] **Step 4: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(routes\)/registry/snapshots/
git commit -m "feat(registry): F13 snapshot detail (before/after) + ADMIN-gated rollback"
```

---

## Task 9: Sidebar nav link

**Files:**
- Modify: `src/app/(routes)/layout.tsx`

- [ ] **Step 1: Add the nav item**

In the `navItems` array (line 6-22), after the `attribute-definitions` entry add:

```typescript
  { href: "/registry", label: "Registry" },
```

Resulting fragment:

```typescript
  { href: "/attribute-definitions", label: "Attribute Definitions" },
  { href: "/registry", label: "Registry" },
  { href: "/promotions", label: "Promotions" },
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(routes\)/layout.tsx
git commit -m "feat(registry): F13 add Registry sidebar nav link"
```

---

## Task 10: Playwright e2e specs

**Files:**
- Create: `tests/registry-list.spec.ts`
- Create: `tests/registry-detail.spec.ts`
- Create: `tests/registry-rollback.spec.ts`
- Create: `tests/registry-revalidation.spec.ts`

**IMPORTANT — shared mutable store:** the MSW store persists across requests within
one `next start` process and is NOT reset between specs (the `reset*` exports are
not wired to any endpoint — same as F9/F10). Therefore: assert presence/shape, not
exact row counts; rollback specs assert the snapshot COUNT GREW and a `rollback`
row appeared, not an absolute total.

**Auth helper (verified):** use `loginAsMockAdmin(page, next, { email })` from
`./helpers/login`. It logs in via the `/login` form and navigates to `next`,
waiting for that URL. Role is derived from email by the mock auth
(`src/lib/auth/mock.ts`): `mod@example.com` → **MODERATOR**, `ops@example.com` →
**ADMIN**, `admin@example.com` → **SUPERADMIN**. Do NOT call `page.goto` separately
after login for the initial route — pass it as `next`.

- [ ] **Step 1: Write tests/registry-list.spec.ts**

```typescript
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("registry snapshots list", () => {
  test("renders seeded snapshots", async ({ page }) => {
    await loginAsMockAdmin(page, "/registry", { email: "mod@example.com" });
    await expect(page.getByTestId("registry-table")).toBeVisible();
    await expect(page.getByTestId("registry-row").first()).toBeVisible();
  });

  test("attribute_key filter narrows rows", async ({ page }) => {
    await loginAsMockAdmin(page, "/registry", { email: "mod@example.com" });
    await page.getByTestId("registry-filter-attribute-key").fill("cuisine");
    await page.getByTestId("registry-filter-apply").click();
    await expect(page).toHaveURL(/attribute_key=cuisine/);
    const rows = page.getByTestId("registry-row");
    await expect(rows.first()).toBeVisible();
    for (const row of await rows.all()) {
      await expect(row).toContainText("cuisine");
    }
  });
});
```

- [ ] **Step 2: Write tests/registry-detail.spec.ts**

```typescript
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("registry snapshot detail", () => {
  test("shows before/after JSON", async ({ page }) => {
    await loginAsMockAdmin(page, "/registry/snapshots/1002", {
      email: "mod@example.com",
    });
    await expect(page.getByTestId("snapshot-detail-id")).toContainText("1002");
    await expect(page.getByTestId("snapshot-before")).toContainText("sort_order");
    await expect(page.getByTestId("snapshot-after")).toContainText("sort_order");
  });

  test("unknown id 404s", async ({ page }) => {
    // Log in first (any role) via a known-good route, then probe the 404.
    await loginAsMockAdmin(page, "/registry", { email: "mod@example.com" });
    const res = await page.goto("/registry/snapshots/99999");
    expect(res?.status()).toBe(404);
  });
});
```

- [ ] **Step 3: Write tests/registry-rollback.spec.ts**

```typescript
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("registry rollback gating", () => {
  test("MODERATOR does not see the rollback button", async ({ page }) => {
    await loginAsMockAdmin(page, "/registry/snapshots/1001", {
      email: "mod@example.com",
    });
    await expect(page.getByTestId("snapshot-detail-id")).toBeVisible();
    await expect(page.getByTestId("snapshot-rollback")).toHaveCount(0);
  });

  test("ADMIN rolls back → a new rollback snapshot appears", async ({ page }) => {
    // ops@example.com → ADMIN
    await loginAsMockAdmin(page, "/registry", { email: "ops@example.com" });
    const before = await page.getByTestId("registry-row").count();

    await page.goto("/registry/snapshots/1001");
    page.on("dialog", (d) => d.accept());
    await page.getByTestId("snapshot-rollback").click();

    // action redirects back to /registry
    await expect(page).toHaveURL(/\/registry$/);
    const after = await page.getByTestId("registry-row").count();
    expect(after).toBeGreaterThan(before);
    // newest row (id DESC) is the rollback we just wrote
    const newest = page.getByTestId("registry-row").first();
    await expect(newest).toContainText("rollback");
  });
});
```

- [ ] **Step 4: Write tests/registry-revalidation.spec.ts**

```typescript
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("registry revalidation panel", () => {
  test("running with defaults renders result counts", async ({ page }) => {
    await loginAsMockAdmin(page, "/registry", { email: "mod@example.com" });
    await page.getByTestId("revalidation-run").click();
    await expect(page.getByTestId("revalidation-result")).toBeVisible();
    await expect(page.getByTestId("revalidation-processed")).toContainText(/\d+/);
  });

  test("invalid category id shows a field error, no result", async ({ page }) => {
    await loginAsMockAdmin(page, "/registry", { email: "mod@example.com" });
    await page.getByTestId("revalidation-category-ids").fill("abc");
    await page.getByTestId("revalidation-run").click();
    await expect(page.getByTestId("revalidation-error")).toContainText("Invalid id");
    await expect(page.getByTestId("revalidation-result")).toHaveCount(0);
  });
});
```

- [ ] **Step 5: Commit**

```bash
git add tests/registry-list.spec.ts tests/registry-detail.spec.ts tests/registry-rollback.spec.ts tests/registry-revalidation.spec.ts
git commit -m "test(registry): F13 e2e — list/detail/rollback-gating/revalidation"
```

---

## Task 11: Build + full verification + final commit

- [ ] **Step 1: Lint + type-check**

Run: `npm run lint && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 2: Production build (REQUIRED before e2e — `test:e2e` serves the existing `.next`, it does NOT rebuild)**

Run: `npm run build`
Expected: build succeeds; the `/registry` and `/registry/snapshots/[id]` routes appear in the route manifest output.

- [ ] **Step 3: Run the registry e2e specs**

Run: `npm run test:e2e -- registry`
Expected: all four registry specs PASS. If the `loginAs` helper path differed,
fix the setup lines and re-run.

- [ ] **Step 4: Run the full e2e suite (catch shared-store regressions)**

Run: `npm run test:e2e`
Expected: full suite green. If a pre-existing spec is red on `main` independent of
this change, check `git stash` + re-run to confirm it is not introduced here (see
F10 lesson: a prior feature's flaky shared-store e2e can block the whole repo).

- [ ] **Step 5: Final no-op commit guard**

```bash
git status   # expect clean working tree; all work committed across Tasks 1-10
```

---

## Self-Review Notes (filled during plan authoring)

- **Spec coverage:** nav (Task 9) ✓; all-3-endpoints (Tasks 2/4/5/7/8) ✓; dedicated
  detail + before/after + ADMIN rollback (Task 8) ✓; full revalidation form (Task 7) ✓;
  no-GET-by-id reconstruction (Task 2 `findRegistrySnapshot`) ✓; forward-only cursor
  (Task 6 pagination) ✓; entity_type free text (Task 6 filters) ✓.
- **Type consistency:** `RegistrySnapshot`, `RegistrySnapshotCursorPage`,
  `RevalidationRunPayload`, `RevalidationRunResult`, `RollbackResponse` defined in
  Task 1 and referenced unchanged in Tasks 2/3/4/5/7/8. Action state types
  (`RollbackState`/`RevalidationState`) defined in Task 5, consumed in Tasks 7/8.
- **No placeholders:** every code step is complete; the one conditional (Task 6
  commit deferred to Task 7) is explicit, not a TODO.
- **Known limitation (documented, not a gap):** `findRegistrySnapshot` only sees the
  newest 100 snapshots — acceptable for the audit surface; revisit if backend adds a
  by-id route.
```
