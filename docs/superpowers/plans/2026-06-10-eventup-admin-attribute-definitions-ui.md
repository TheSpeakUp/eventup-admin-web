# Attribute-Definitions CRUD UI (F9) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a CRUD admin UI for the marketplace attribute-definitions registry in `eventup-admin-web`, mirroring the shipped categories feature (F8).

**Architecture:** App-Router server components for list/detail/new pages; `"use server"` actions validate FormData with Zod and call a typed `apiFetch` client against `/eventup-admin/v1/marketplace/attribute-definitions`. An MSW in-memory mock backend serves Playwright e2e. The single structural divergence from categories: the resource is addressed by a string `attribute_key` path segment, not an int `id`.

**Tech Stack:** Next.js 16 (App Router), React 19 (`useActionState`), TypeScript, Zod v4, MSW, Playwright, Tailwind v4, pnpm.

**Template (read before each task):** the categories feature is the verbatim pattern. Source files referenced per task. Spec: `docs/superpowers/specs/2026-06-10-eventup-admin-attribute-definitions-ui-design.md`.

**Pre-code gate (AGENTS.md):** before writing component/page/action code, skim the Next 16 App-Router server-actions/forms guide under `node_modules/next/dist/docs/`; if absent, use context7 Next.js. The React 19 `<form action>` reset gotcha is already solved by the key-remount idiom + the editor's onChange-validate (both reproduced below) — do not re-derive.

**Verification env (all builds/e2e):** `NEXT_PUBLIC_USE_MOCK_AUTH=true NEXT_PUBLIC_USE_MOCK_BACKEND=true NEXT_PUBLIC_API_URL=http://127.0.0.1:65535`.

**Backend contract (verified `eventup-backend` `origin/main`):**
- Namespace `/eventup-admin/v1/marketplace/attribute-definitions`. Path param `attribute_key` (str).
- `POST /list` (READ) → `{items, next_last_id, has_more, count}`. Filter body: `search?(≤200)`, `group_name?(≤64)`, `is_active?:bool`, `last_id?:int≥1`, `limit=50(1..100)`, `sort?`.
- Sort enum: `key_asc | key_desc | sort_order_asc | sort_order_desc`.
- `GET /{key}` (READ). `POST /` →201 (MODERATE). `PUT /{key}` (MODERATE, **empty body→400**). `DELETE /{key}` (RISK, ADMIN+).
- `Read`: `id:int, key:str, descriptor:dict, group_name:str|None, sort_order:int, is_active:bool, is_system:bool, bindings_count:int`.
- `Create`: `key`(1..100,req), `descriptor`(dict|str,req), `group_name?(≤64)`, `sort_order`(default 100, 0..10000), `is_active`(default true), `is_system`(default false).
- `Update`: `descriptor?, group_name?, sort_order?, is_active?, is_system?` (no `key`).
- `descriptor`: FE does `JSON.parse` only, accepts any valid JSON (object or string); backend normalizes + deep-validates.

---

## Task 1: API types + client

**Files:**
- Create: `src/lib/attribute-definitions/types.ts`
- Create: `src/lib/attribute-definitions/api.ts`

Mirror of `src/lib/categories/{types,api}.ts`. Deltas: string `key` instead of int `id`; sort enum is `key_*`/`sort_order_*`; fields are the attribute-definition set; `descriptor` is freeform JSON.

- [ ] **Step 1: Write `types.ts`**

```typescript
// src/lib/attribute-definitions/types.ts

export const ATTRIBUTE_DEFINITION_SORTS = [
  "key_asc",
  "key_desc",
  "sort_order_asc",
  "sort_order_desc",
] as const;
export type AttributeDefinitionSort =
  (typeof ATTRIBUTE_DEFINITION_SORTS)[number];

// descriptor is a freeform JSON object on read (backend normalizes dict|str → dict).
export type AttributeDescriptorDoc = Record<string, unknown>;

export type AttributeDefinitionRead = {
  id: number;
  key: string;
  descriptor: AttributeDescriptorDoc;
  group_name: string | null;
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
  bindings_count: number;
};

export type AttributeDefinitionCursorPage = {
  items: AttributeDefinitionRead[];
  next_last_id: number | null;
  has_more: boolean;
  count: number;
};

export type AttributeDefinitionListQuery = {
  search?: string;
  group_name?: string;
  is_active?: boolean;
  sort?: AttributeDefinitionSort;
  last_id?: number;
  limit?: number;
};

// Mutation payload. `key` is create-only (immutable PK). Omitted keys = unchanged on PUT.
export type AttributeDefinitionMutationPayload = {
  key?: string;
  descriptor?: AttributeDescriptorDoc | string;
  group_name?: string | null;
  sort_order?: number;
  is_active?: boolean;
  is_system?: boolean;
};

export function isAttributeDefinitionSort(
  value: string,
): value is AttributeDefinitionSort {
  return (ATTRIBUTE_DEFINITION_SORTS as readonly string[]).includes(value);
}
```

- [ ] **Step 2: Write `api.ts`**

```typescript
// src/lib/attribute-definitions/api.ts
import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  AttributeDefinitionCursorPage,
  AttributeDefinitionListQuery,
  AttributeDefinitionMutationPayload,
  AttributeDefinitionRead,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace/attribute-definitions";

// List is a POST with a body filter (mirror categories).
export function listAttributeDefinitions(
  query: AttributeDefinitionListQuery = {},
): Promise<ApiFetchResult<AttributeDefinitionCursorPage>> {
  const body: Record<string, unknown> = { limit: query.limit ?? 50 };
  if (query.search) body.search = query.search;
  if (query.group_name) body.group_name = query.group_name;
  if (query.is_active !== undefined) body.is_active = query.is_active;
  if (query.sort) body.sort = query.sort;
  if (query.last_id !== undefined) body.last_id = query.last_id;
  return apiFetch<AttributeDefinitionCursorPage>(`${BASE}/list`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getAttributeDefinition(
  key: string,
): Promise<ApiFetchResult<AttributeDefinitionRead>> {
  return apiFetch<AttributeDefinitionRead>(`${BASE}/${encodeURIComponent(key)}`);
}

export function createAttributeDefinition(
  payload: AttributeDefinitionMutationPayload,
): Promise<ApiFetchResult<AttributeDefinitionRead>> {
  return apiFetch<AttributeDefinitionRead>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function updateAttributeDefinition(
  key: string,
  payload: AttributeDefinitionMutationPayload,
): Promise<ApiFetchResult<AttributeDefinitionRead>> {
  return apiFetch<AttributeDefinitionRead>(
    `${BASE}/${encodeURIComponent(key)}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
      redirectOn401: false,
    },
  );
}

export function deleteAttributeDefinition(
  key: string,
): Promise<ApiFetchResult<{ success?: boolean; message?: string } | null>> {
  return apiFetch<{ success?: boolean; message?: string } | null>(
    `${BASE}/${encodeURIComponent(key)}`,
    { method: "DELETE", redirectOn401: false },
  );
}
```

- [ ] **Step 3: Type-check + commit**

Run: `npm run build` (mock env). Expected: PASS (no type errors). If `apiFetch`/`ApiFetchResult` import path differs, match `src/lib/categories/api.ts` exactly.

```bash
git add src/lib/attribute-definitions/types.ts src/lib/attribute-definitions/api.ts
git commit -m "feat(attribute-definitions): typed API client + types"
```

---

## Task 2: Mock store + fixtures

**Files:**
- Create: `src/mocks/attribute-definitions-fixtures.ts`
- Create: `src/mocks/attribute-definitions-store.ts`

Mirror of `src/mocks/categories-{fixtures,store}.ts`. Deltas: store still uses an int `id` internally (cursor pivot) but is **looked up by `key` string**; no parent/leaf/translations machinery; `search` covers `key` + `group_name`; sort handles `key_*` + `sort_order_*`.

- [ ] **Step 1: Write `attribute-definitions-fixtures.ts`**

```typescript
// src/mocks/attribute-definitions-fixtures.ts
import type { AttributeDefinitionRead } from "@/lib/attribute-definitions/types";

export function buildFixtureAttributeDefinitions(): AttributeDefinitionRead[] {
  return [
    {
      id: 1,
      key: "cuisine",
      descriptor: { type: "string", searchable: true },
      group_name: "catering",
      sort_order: 10,
      is_active: true,
      is_system: false,
      bindings_count: 3,
    },
    {
      id: 2,
      key: "seats",
      descriptor: { type: "integer", required: false },
      group_name: "venue",
      sort_order: 20,
      is_active: true,
      is_system: false,
      bindings_count: 1,
    },
    {
      id: 3,
      key: "legacy_flag",
      descriptor: { type: "boolean" },
      group_name: null,
      sort_order: 30,
      is_active: false,
      is_system: true,
      bindings_count: 0,
    },
  ];
}
```

- [ ] **Step 2: Write `attribute-definitions-store.ts`**

```typescript
// src/mocks/attribute-definitions-store.ts
import type {
  AttributeDefinitionCursorPage,
  AttributeDefinitionRead,
} from "@/lib/attribute-definitions/types";
import { buildFixtureAttributeDefinitions } from "./attribute-definitions-fixtures";

// Keyed by `key` (the public PK). `id` is the internal cursor pivot.
const defs = new Map<string, AttributeDefinitionRead>();
let nextId = 100;

function ensureSeed(): void {
  if (defs.size > 0) return;
  for (const d of buildFixtureAttributeDefinitions()) defs.set(d.key, d);
}

export function resetAttributeDefinitionsStore(): void {
  defs.clear();
  nextId = 100;
  ensureSeed();
}

export function getAttributeDefinitionByKey(
  key: string,
): AttributeDefinitionRead | null {
  ensureSeed();
  return defs.get(key) ?? null;
}

export function listAttributeDefinitionsPage(opts: {
  search?: string;
  group_name?: string;
  is_active?: boolean;
  sort?: string;
  last_id?: number;
  limit?: number;
}): AttributeDefinitionCursorPage {
  ensureSeed();
  let rows = Array.from(defs.values());
  if (opts.search) {
    const q = opts.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.key.toLowerCase().includes(q) ||
        (r.group_name?.toLowerCase().includes(q) ?? false),
    );
  }
  if (opts.group_name) {
    rows = rows.filter((r) => r.group_name === opts.group_name);
  }
  if (opts.is_active !== undefined) {
    rows = rows.filter((r) => r.is_active === opts.is_active);
  }
  switch (opts.sort) {
    case "key_asc":
      rows.sort((a, b) => a.key.localeCompare(b.key));
      break;
    case "key_desc":
      rows.sort((a, b) => b.key.localeCompare(a.key));
      break;
    case "sort_order_desc":
      rows.sort((a, b) => b.sort_order - a.sort_order || a.id - b.id);
      break;
    default: // sort_order_asc
      rows.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  }
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
  let start = 0;
  if (opts.last_id !== undefined) {
    const idx = rows.findIndex((r) => r.id === opts.last_id);
    start = idx >= 0 ? idx + 1 : 0;
  }
  const slice = rows.slice(start, start + limit);
  const hasMore = start + limit < rows.length;
  return {
    items: slice,
    next_last_id: hasMore ? (slice[slice.length - 1]?.id ?? null) : null,
    has_more: hasMore,
    count: slice.length,
  };
}

export type AttributeDefinitionWrite = Partial<
  Omit<AttributeDefinitionRead, "id" | "bindings_count">
>;

export function createAttributeDefinitionRecord(
  input: AttributeDefinitionWrite,
): AttributeDefinitionRead {
  ensureSeed();
  const id = nextId++;
  const record: AttributeDefinitionRead = {
    id,
    key: input.key ?? "",
    descriptor: input.descriptor ?? {},
    group_name: input.group_name ?? null,
    sort_order: input.sort_order ?? 100,
    is_active: input.is_active ?? true,
    is_system: input.is_system ?? false,
    bindings_count: 0,
  };
  defs.set(record.key, record);
  return record;
}

export function updateAttributeDefinitionRecord(
  key: string,
  patch: AttributeDefinitionWrite,
): AttributeDefinitionRead | null {
  ensureSeed();
  const current = defs.get(key);
  if (!current) return null;
  const updated: AttributeDefinitionRead = {
    ...current,
    ...(patch.descriptor !== undefined ? { descriptor: patch.descriptor } : {}),
    ...(patch.group_name !== undefined
      ? { group_name: patch.group_name }
      : {}),
    ...(patch.sort_order !== undefined ? { sort_order: patch.sort_order } : {}),
    ...(patch.is_active !== undefined ? { is_active: patch.is_active } : {}),
    ...(patch.is_system !== undefined ? { is_system: patch.is_system } : {}),
  };
  defs.set(key, updated);
  return updated;
}

export function deleteAttributeDefinitionRecord(key: string): boolean {
  ensureSeed();
  return defs.delete(key);
}
```

- [ ] **Step 3: Type-check + commit**

Run: `npm run build` (mock env). Expected: PASS.

```bash
git add src/mocks/attribute-definitions-fixtures.ts src/mocks/attribute-definitions-store.ts
git commit -m "feat(attribute-definitions): MSW in-memory store + fixtures"
```

---

## Task 3: Mock handlers

**Files:**
- Modify: `src/mocks/handlers.ts`

Mirror the categories handler slice (lines ~629-694). Add imports, a `toAttributeDefinitionWrite` normalizer, a `ATTRIBUTE_DEFINITIONS_BASE` const, and 5 handlers. Literal `/list` registered before `/:key`. Reproduce: delete role-gate (ADMIN+), and the **empty-PUT→400** parity.

- [ ] **Step 1: Add store imports** after the existing `./categories-store` import block (near line 54):

```typescript
import {
  createAttributeDefinitionRecord,
  deleteAttributeDefinitionRecord,
  getAttributeDefinitionByKey,
  listAttributeDefinitionsPage,
  updateAttributeDefinitionRecord,
  type AttributeDefinitionWrite,
} from "./attribute-definitions-store";
```

- [ ] **Step 2: Add the base const** next to `CATEGORIES_BASE` (near line 60):

```typescript
const ATTRIBUTE_DEFINITIONS_BASE = buildApiUrl(
  "/eventup-admin/v1/marketplace/attribute-definitions",
);
```

- [ ] **Step 3: Add the body normalizer** next to `toCategoryWrite` (after it, ~line 145):

```typescript
// Pick known attribute-definition keys from an untyped JSON body. The server
// action already validated/coerced each field; here we only keep typed keys.
function toAttributeDefinitionWrite(
  body: Record<string, unknown>,
): AttributeDefinitionWrite {
  const out: AttributeDefinitionWrite = {};
  if (typeof body.key === "string") out.key = body.key;
  if (typeof body.descriptor === "object" && body.descriptor !== null)
    out.descriptor = body.descriptor as Record<string, unknown>;
  if (typeof body.group_name === "string" || body.group_name === null)
    out.group_name = body.group_name as string | null;
  if (typeof body.sort_order === "number") out.sort_order = body.sort_order;
  if (typeof body.is_active === "boolean") out.is_active = body.is_active;
  if (typeof body.is_system === "boolean") out.is_system = body.is_system;
  return out;
}
```

- [ ] **Step 4: Add the 5 handlers** immediately after the categories `http.delete(...)` block (after line 694), inside the `handlers` array:

```typescript
  // ---- Marketplace attribute-definitions (literal /list before /:key) ----
  http.post(`${ATTRIBUTE_DEFINITIONS_BASE}/list`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      search?: string;
      group_name?: string;
      is_active?: boolean;
      sort?: string;
      last_id?: number;
      limit?: number;
    };
    return HttpResponse.json(listAttributeDefinitionsPage(body));
  }),
  http.post(ATTRIBUTE_DEFINITIONS_BASE, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const created = createAttributeDefinitionRecord(
      toAttributeDefinitionWrite(body),
    );
    return HttpResponse.json(created, { status: 201 });
  }),
  http.get(`${ATTRIBUTE_DEFINITIONS_BASE}/:key`, ({ params }) => {
    const found = getAttributeDefinitionByKey(String(params.key));
    if (!found)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(found);
  }),
  http.put(`${ATTRIBUTE_DEFINITIONS_BASE}/:key`, async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const patch = toAttributeDefinitionWrite(body);
    // Backend rejects an empty update body with 400 (parity).
    if (Object.keys(patch).length === 0) {
      return HttpResponse.json(
        {
          error: {
            message: "Request cannot be processed",
            meta: { original_detail: "No fields to update" },
          },
        },
        { status: 400 },
      );
    }
    const updated = updateAttributeDefinitionRecord(String(params.key), patch);
    if (!updated)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(updated);
  }),
  http.delete(`${ATTRIBUTE_DEFINITIONS_BASE}/:key`, ({ params, request }) => {
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
    const ok = deleteAttributeDefinitionRecord(String(params.key));
    if (!ok) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return new HttpResponse(null, { status: 204 });
  }),
```

- [ ] **Step 5: Type-check + commit**

Run: `npm run build` (mock env). Expected: PASS.

```bash
git add src/mocks/handlers.ts
git commit -m "feat(attribute-definitions): MSW handlers for all 5 routes"
```

---

## Task 4: Server actions + action-types

**Files:**
- Create: `src/app/(routes)/attribute-definitions/action-types.ts`
- Create: `src/app/(routes)/attribute-definitions/actions.ts`

Mirror `categories/{action-types,actions}.ts`. Deltas: no pricing/translations/parent logic; `descriptor` parsed with `JSON.parse` only (no shape Zod); `key` required on create, used as the path param on update/delete (string, not int id); create redirects to `/attribute-definitions/{key}`.

- [ ] **Step 1: Write `action-types.ts`**

```typescript
// src/app/(routes)/attribute-definitions/action-types.ts
export type ActionState =
  | { ok: true; error: null }
  | { ok: false; error: string };
export const EMPTY_STATE: ActionState = { ok: true, error: null };
```

- [ ] **Step 2: Write `actions.ts`**

```typescript
// src/app/(routes)/attribute-definitions/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAttributeDefinition,
  deleteAttributeDefinition,
  updateAttributeDefinition,
} from "@/lib/attribute-definitions/api";
import type { AttributeDefinitionMutationPayload } from "@/lib/attribute-definitions/types";
import type { ActionState } from "./action-types";

function fail(message: string): ActionState {
  return { ok: false, error: message };
}

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

// A hidden checkbox carries "true"/"false"; absence → undefined (leave unchanged).
function bool(formData: FormData, key: string): boolean | undefined {
  const v = formData.get(key);
  if (typeof v !== "string" || v === "") return undefined;
  return v === "true";
}

// Build the payload. `requireKey`/`requireDescriptor` = true for create.
function buildPayload(
  formData: FormData,
  requireKey: boolean,
):
  | { ok: true; payload: AttributeDefinitionMutationPayload }
  | { ok: false; error: string } {
  const payload: AttributeDefinitionMutationPayload = {};

  if (requireKey) {
    const key = str(formData, "key");
    if (!key) return { ok: false, error: "Key is required" };
    if (key.length > 100)
      return { ok: false, error: "Key must be at most 100 characters" };
    payload.key = key;
  }

  // descriptor: JSON.parse only; accept any valid JSON (object or string).
  // Required on create. Backend deep-validates the shape.
  const descRaw = formData.get("descriptor");
  const descStr = typeof descRaw === "string" ? descRaw.trim() : "";
  if (descStr === "") {
    if (requireKey) return { ok: false, error: "descriptor is required" };
  } else {
    try {
      payload.descriptor = JSON.parse(descStr);
    } catch {
      return { ok: false, error: "descriptor: invalid JSON" };
    }
  }

  const group = str(formData, "group_name");
  if (group !== undefined) {
    if (group.length > 64)
      return { ok: false, error: "Group name must be at most 64 characters" };
    payload.group_name = group;
  }

  const sortRaw = str(formData, "sort_order");
  if (sortRaw !== undefined) {
    const n = Number(sortRaw);
    if (!Number.isInteger(n) || n < 0 || n > 10000)
      return { ok: false, error: "Sort order must be an integer 0–10000" };
    payload.sort_order = n;
  }

  const isActive = bool(formData, "is_active");
  if (isActive !== undefined) payload.is_active = isActive;
  const isSystem = bool(formData, "is_system");
  if (isSystem !== undefined) payload.is_system = isSystem;

  return { ok: true, payload };
}

export async function createAttributeDefinitionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const built = buildPayload(formData, true);
  if (!built.ok) return fail(built.error);
  const result = await createAttributeDefinition(built.payload);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath("/attribute-definitions");
  redirect(`/attribute-definitions/${encodeURIComponent(result.data.key)}`);
}

export async function updateAttributeDefinitionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const key = str(formData, "key");
  if (!key) return fail("Invalid attribute key");
  const built = buildPayload(formData, false);
  if (!built.ok) return fail(built.error);
  if (Object.keys(built.payload).length === 0) return fail("Nothing to update");
  const result = await updateAttributeDefinition(key, built.payload);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath(`/attribute-definitions/${encodeURIComponent(key)}`);
  revalidatePath("/attribute-definitions");
  return { ok: true, error: null };
}

export async function deleteAttributeDefinitionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const key = str(formData, "key");
  if (!key) return fail("Invalid attribute key");
  const result = await deleteAttributeDefinition(key);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath("/attribute-definitions");
  redirect("/attribute-definitions");
}
```

> NOTE on the edit form's `key`: on edit the form submits `key` as a **read-only hidden/disabled-display field** used only to address the PUT; `buildPayload(requireKey=false)` never copies it into the payload, so the immutable PK is never sent in the body. Good.

- [ ] **Step 3: Type-check + commit**

Run: `npm run build` (mock env). Expected: PASS.

```bash
git add "src/app/(routes)/attribute-definitions/action-types.ts" "src/app/(routes)/attribute-definitions/actions.ts"
git commit -m "feat(attribute-definitions): zod-validated server actions"
```

---

## Task 5: Components

**Files:**
- Create: `src/app/(routes)/attribute-definitions/_components/DescriptorEditor.tsx`
- Create: `src/app/(routes)/attribute-definitions/_components/AttributeDefinitionsTable.tsx`
- Create: `src/app/(routes)/attribute-definitions/_components/AttributeDefinitionForm.tsx`
- Create: `src/app/(routes)/attribute-definitions/_components/DeleteAttributeDefinitionButton.tsx`

- [ ] **Step 1: Write `DescriptorEditor.tsx`** (rename of `AttributeSchemaEditor`; same onChange-validate idiom — keep it, it prevents the React 19 submit-swallow):

```typescript
// src/app/(routes)/attribute-definitions/_components/DescriptorEditor.tsx
"use client";
import { useState } from "react";

export function DescriptorEditor({
  initial,
}: {
  initial?: Record<string, unknown> | null;
}) {
  const [text, setText] = useState(
    initial ? JSON.stringify(initial, null, 2) : "",
  );
  const [err, setErr] = useState<string | null>(null);
  // Validate on change (not blur): a blur firing during the submit click would
  // re-render mid-submit and swallow the first form-action POST (React 19
  // controlled-input + <form action>). Settling the error as the user types
  // keeps the submit click clean.
  function validate(value: string) {
    if (value.trim() === "") return setErr(null);
    try {
      JSON.parse(value);
      setErr(null);
    } catch {
      setErr("Invalid JSON");
    }
  }
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium" htmlFor="descriptor">
        Descriptor (JSON)
      </label>
      <textarea
        id="descriptor"
        name="descriptor"
        data-testid="descriptor-input"
        rows={8}
        className="w-full rounded border px-2 py-1 font-mono text-xs"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          validate(e.target.value);
        }}
        placeholder='{ "type": "string", "searchable": true }'
      />
      {err ? (
        <p data-testid="descriptor-error" className="text-sm text-red-700">
          {err}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Write `AttributeDefinitionsTable.tsx`** (mirror `CategoriesTable`; columns key/group/sort/active/system/bindings; row links by `key`):

```typescript
// src/app/(routes)/attribute-definitions/_components/AttributeDefinitionsTable.tsx
import Link from "next/link";
import type { AttributeDefinitionRead } from "@/lib/attribute-definitions/types";

export function AttributeDefinitionsTable({
  rows,
}: {
  rows: AttributeDefinitionRead[];
}) {
  if (rows.length === 0)
    return (
      <p data-testid="attribute-definitions-empty" className="p-4 text-gray-500">
        No attribute definitions yet.
      </p>
    );
  return (
    <table
      className="w-full text-sm"
      data-testid="attribute-definitions-table"
    >
      <thead>
        <tr className="text-left text-gray-500">
          <th className="py-2">Key</th>
          <th>Group</th>
          <th>Sort</th>
          <th>Active</th>
          <th>System</th>
          <th>Bindings</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.key}
            className="border-t"
            data-testid={`attribute-definition-row-${r.key}`}
          >
            <td className="py-2">{r.key}</td>
            <td>{r.group_name ?? "—"}</td>
            <td>{r.sort_order}</td>
            <td>{r.is_active ? "yes" : "no"}</td>
            <td>{r.is_system ? "yes" : "no"}</td>
            <td>{r.bindings_count}</td>
            <td>
              <Link
                href={`/attribute-definitions/${encodeURIComponent(r.key)}`}
                data-testid={`attribute-definition-edit-${r.key}`}
                className="text-blue-700"
              >
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 3: Write `AttributeDefinitionForm.tsx`** (mirror `CategoryForm`; `key` editable on create, read-only + hidden-submit on edit; checkboxes back hidden true/false fields so the action's `bool()` reads them):

```typescript
// src/app/(routes)/attribute-definitions/_components/AttributeDefinitionForm.tsx
"use client";
import { useActionState } from "react";
import {
  createAttributeDefinitionAction,
  updateAttributeDefinitionAction,
} from "../actions";
import { EMPTY_STATE } from "../action-types";
import type { AttributeDefinitionRead } from "@/lib/attribute-definitions/types";
import { DescriptorEditor } from "./DescriptorEditor";

export function AttributeDefinitionForm({
  mode,
  definition,
}: {
  mode: "create" | "edit";
  definition?: AttributeDefinitionRead;
}) {
  const action =
    mode === "create"
      ? createAttributeDefinitionAction
      : updateAttributeDefinitionAction;
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);
  const d = definition;
  return (
    <form
      action={formAction}
      data-testid="attribute-definition-form"
      className="space-y-4"
    >
      {mode === "edit" && d ? (
        <input type="hidden" name="key" value={d.key} />
      ) : null}

      <label className="block">
        <span className="text-sm font-medium">Key</span>
        <input
          name={mode === "create" ? "key" : undefined}
          data-testid="attribute-definition-key"
          defaultValue={d?.key ?? ""}
          required={mode === "create"}
          readOnly={mode === "edit"}
          className="mt-1 w-full rounded border px-2 py-1 read-only:bg-zinc-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Group name</span>
        <input
          name="group_name"
          data-testid="attribute-definition-group"
          defaultValue={d?.group_name ?? ""}
          className="mt-1 w-full rounded border px-2 py-1"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Sort order</span>
        <input
          name="sort_order"
          type="number"
          defaultValue={d?.sort_order ?? 100}
          className="mt-1 w-32 rounded border px-2 py-1"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_active"
          value="true"
          data-testid="attribute-definition-active"
          defaultChecked={d?.is_active ?? true}
        />
        <span className="text-sm font-medium">Active</span>
      </label>
      {/* Hidden "false" sentinel so an unchecked box submits is_active=false.
          The checked box's value="true" wins when both are present (last value
          read by the action is the checkbox); see bool() in actions.ts. */}
      <input type="hidden" name="is_active" value="false" />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_system"
          value="true"
          data-testid="attribute-definition-system"
          defaultChecked={d?.is_system ?? false}
        />
        <span className="text-sm font-medium">System</span>
      </label>
      <input type="hidden" name="is_system" value="false" />

      <DescriptorEditor initial={d?.descriptor ?? null} />

      <button
        type="submit"
        disabled={pending}
        data-testid="attribute-definition-submit"
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
      </button>
      {state && !state.ok && state.error ? (
        <p
          data-testid="attribute-definition-error"
          className="text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
```

> **Checkbox/hidden ordering caveat — RESOLVE during implementation:** a `<form>` with both `name="is_active"` checkbox (value `true`, when checked) and a later `name="is_active"` hidden (value `false`) submits BOTH when checked. `FormData.get("is_active")` returns the FIRST entry (the checkbox `true`); when unchecked only the hidden `false` is submitted. So `bool()` using `formData.get` reads the checkbox when present — correct. **Verify this in the Task 8 CRUD test** (toggle active off → record persists `is_active=false`). If `get` semantics differ, switch the action to `formData.getAll("is_active").includes("true")`.

- [ ] **Step 4: Write `DeleteAttributeDefinitionButton.tsx`** (mirror `DeleteCategoryButton`; addressed by `key`):

```typescript
// src/app/(routes)/attribute-definitions/_components/DeleteAttributeDefinitionButton.tsx
"use client";
import { useActionState } from "react";
import { deleteAttributeDefinitionAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

export function DeleteAttributeDefinitionButton({ attrKey }: { attrKey: string }) {
  const [state, formAction, pending] = useActionState(
    deleteAttributeDefinitionAction,
    EMPTY_STATE,
  );
  return (
    <form
      action={formAction}
      data-testid="attribute-definition-delete-form"
      onSubmit={(e) => {
        if (!confirm("Delete this attribute definition? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="key" value={attrKey} />
      <button
        type="submit"
        disabled={pending}
        data-testid="attribute-definition-delete"
        className="rounded border border-red-300 px-4 py-2 text-red-700"
      >
        {pending ? "Deleting…" : "Delete attribute definition"}
      </button>
      {state && !state.ok && state.error ? (
        <p
          data-testid="attribute-definition-delete-error"
          className="text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
```

- [ ] **Step 5: Type-check + commit**

Run: `npm run build` (mock env). Expected: PASS.

```bash
git add "src/app/(routes)/attribute-definitions/_components"
git commit -m "feat(attribute-definitions): form, table, descriptor editor, delete button"
```

---

## Task 6: Pages (list / new / detail)

**Files:**
- Create: `src/app/(routes)/attribute-definitions/page.tsx`
- Create: `src/app/(routes)/attribute-definitions/new/page.tsx`
- Create: `src/app/(routes)/attribute-definitions/[key]/page.tsx`

- [ ] **Step 1: Write `page.tsx`** (list; mirror `categories/page.tsx`; adds group_name + is_active filters, key/sort_order sort options):

```typescript
// src/app/(routes)/attribute-definitions/page.tsx
import Link from "next/link";
import { listAttributeDefinitions } from "@/lib/attribute-definitions/api";
import { isAttributeDefinitionSort } from "@/lib/attribute-definitions/types";
import { AttributeDefinitionsTable } from "./_components/AttributeDefinitionsTable";

export default async function AttributeDefinitionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    group_name?: string;
    is_active?: string;
    sort?: string;
  }>;
}) {
  const sp = await searchParams;
  const sort =
    sp.sort && isAttributeDefinitionSort(sp.sort) ? sp.sort : "sort_order_asc";
  const is_active =
    sp.is_active === "true" ? true : sp.is_active === "false" ? false : undefined;
  const result = await listAttributeDefinitions({
    search: sp.search,
    group_name: sp.group_name,
    is_active,
    sort,
    limit: 100,
  });

  if (!result.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Attribute Definitions</h1>
        <div
          data-testid="attribute-definitions-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {result.status === 403
            ? "Viewing attribute definitions requires an admin role."
            : `Failed to load attribute definitions: ${result.message}`}
        </div>
      </div>
    );
  }

  const rows = result.data.items;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Attribute Definitions</h1>
        <Link
          href="/attribute-definitions/new"
          data-testid="attribute-definition-new"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          New attribute definition
        </Link>
      </div>

      <form
        className="mt-4 flex flex-wrap gap-2"
        data-testid="attribute-definitions-search"
      >
        <input
          name="search"
          placeholder="Search key or group"
          defaultValue={sp.search ?? ""}
          className="rounded border px-2 py-1"
        />
        <input
          name="group_name"
          placeholder="Group name"
          defaultValue={sp.group_name ?? ""}
          className="rounded border px-2 py-1"
        />
        <select
          name="is_active"
          defaultValue={sp.is_active ?? ""}
          className="rounded border px-2 py-1"
        >
          <option value="">Any status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select name="sort" defaultValue={sort} className="rounded border px-2 py-1">
          <option value="sort_order_asc">Sort ↑</option>
          <option value="sort_order_desc">Sort ↓</option>
          <option value="key_asc">Key A–Z</option>
          <option value="key_desc">Key Z–A</option>
        </select>
        <button type="submit" className="rounded border px-3 py-1">
          Apply
        </button>
      </form>

      <div className="mt-4">
        <AttributeDefinitionsTable rows={rows} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `new/page.tsx`**:

```typescript
// src/app/(routes)/attribute-definitions/new/page.tsx
import { AttributeDefinitionForm } from "../_components/AttributeDefinitionForm";

export default function NewAttributeDefinitionPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">New attribute definition</h1>
      <div className="mt-4 max-w-2xl">
        <AttributeDefinitionForm mode="create" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `[key]/page.tsx`** (detail+edit; key-remount idiom; delete gated ADMIN+; show bindings_count read-only):

```typescript
// src/app/(routes)/attribute-definitions/[key]/page.tsx
import { notFound } from "next/navigation";
import { getAttributeDefinition } from "@/lib/attribute-definitions/api";
import { getAdminSession } from "@/lib/auth/session";
import { AttributeDefinitionForm } from "../_components/AttributeDefinitionForm";
import { DeleteAttributeDefinitionButton } from "../_components/DeleteAttributeDefinitionButton";

export default async function AttributeDefinitionDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const decodedKey = decodeURIComponent(key);
  const [defRes, session] = await Promise.all([
    getAttributeDefinition(decodedKey),
    getAdminSession(),
  ]);

  if (defRes.status === 404) notFound();
  if (!defRes.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Attribute definition</h1>
        <div
          data-testid="attribute-definition-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {`Failed to load attribute definition: ${defRes.message}`}
        </div>
      </div>
    );
  }

  const definition = defRes.data;
  // Delete requires ADMIN_MARKETPLACE_PROVIDERS_RISK → ADMIN or SUPERADMIN.
  const canDelete =
    session?.role === "ADMIN" || session?.role === "SUPERADMIN";

  // Key-remount so revalidated server values reset the uncontrolled form
  // (React 19 <form action> reset gotcha — see PR #18).
  const formKey = `${definition.key}:${definition.sort_order}:${definition.is_active}:${definition.is_system}`;

  return (
    <div className="p-8">
      <h1
        className="text-2xl font-semibold"
        data-testid="attribute-definition-detail-key"
      >
        {definition.key}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Bound to {definition.bindings_count}{" "}
        {definition.bindings_count === 1 ? "category" : "categories"}
      </p>
      <div className="mt-4 max-w-2xl space-y-6">
        <AttributeDefinitionForm
          key={formKey}
          mode="edit"
          definition={definition}
        />
        {canDelete ? (
          <DeleteAttributeDefinitionButton attrKey={definition.key} />
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Type-check + commit**

Run: `npm run build` (mock env). Expected: PASS.

```bash
git add "src/app/(routes)/attribute-definitions/page.tsx" "src/app/(routes)/attribute-definitions/new/page.tsx" "src/app/(routes)/attribute-definitions/[key]/page.tsx"
git commit -m "feat(attribute-definitions): list, new, and detail pages"
```

---

## Task 7: Nav link

**Files:**
- Modify: `src/app/(routes)/layout.tsx`

- [ ] **Step 1: Add the nav item** to `navItems` (after the `/categories` entry, before the superadminOnly `/admins` entry). Visible to all three roles (all hold READ) — no `superadminOnly` flag:

```typescript
  { href: "/categories", label: "Categories" },
  { href: "/attribute-definitions", label: "Attribute Definitions" },
```

- [ ] **Step 2: Type-check + commit**

Run: `npm run build` (mock env). Expected: PASS.

```bash
git add "src/app/(routes)/layout.tsx"
git commit -m "feat(attribute-definitions): sidebar nav link"
```

---

## Task 8: E2E tests

**Files:**
- Create: `tests/attribute-definitions-list.spec.ts`
- Create: `tests/attribute-definitions-crud.spec.ts`
- Create: `tests/attribute-definitions-guards.spec.ts`

**Isolation rule (critical):** the e2e run shares ONE in-memory store across all spec files (single `next start`, workers:1, no per-test reset; alphabetical file order). Mutation tests create-then-mutate their OWN records; never rename/delete seeded fixtures (`cuisine`, `seats`, `legacy_flag`) that the list spec asserts on.

- [ ] **Step 1: Write `attribute-definitions-list.spec.ts`**

```typescript
// tests/attribute-definitions-list.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Attribute definitions list", () => {
  test("renders seeded definitions", async ({ page }) => {
    await loginAsMockAdmin(page, "/attribute-definitions");
    await expect(
      page.getByTestId("attribute-definitions-table"),
    ).toBeVisible();
    await expect(
      page.getByTestId("attribute-definition-row-cuisine"),
    ).toBeVisible();
    await expect(
      page.getByTestId("attribute-definition-row-seats"),
    ).toBeVisible();
  });

  test("search filters rows by key", async ({ page }) => {
    await loginAsMockAdmin(page, "/attribute-definitions");
    await page.getByPlaceholder("Search key or group").fill("cuisine");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(
      page.getByTestId("attribute-definition-row-cuisine"),
    ).toBeVisible();
    await expect(
      page.getByTestId("attribute-definition-row-seats"),
    ).toHaveCount(0);
  });

  test("is_active filter hides inactive definitions", async ({ page }) => {
    // legacy_flag is seeded is_active=false.
    await loginAsMockAdmin(page, "/attribute-definitions?is_active=true");
    await expect(
      page.getByTestId("attribute-definition-row-cuisine"),
    ).toBeVisible();
    await expect(
      page.getByTestId("attribute-definition-row-legacy_flag"),
    ).toHaveCount(0);
  });

  test("nav link is present", async ({ page }) => {
    await loginAsMockAdmin(page, "/services");
    await expect(
      page.getByRole("link", { name: "Attribute Definitions" }),
    ).toBeVisible();
  });
});
```

- [ ] **Step 2: Write `attribute-definitions-crud.spec.ts`**

```typescript
// tests/attribute-definitions-crud.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Attribute definitions CRUD", () => {
  test("create a definition and land on its detail", async ({ page }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await page.getByTestId("attribute-definition-key").fill("color");
    await page
      .getByTestId("descriptor-input")
      .fill('{"type":"string","searchable":true}');
    await page.getByTestId("attribute-definition-submit").click();
    await expect(
      page.getByTestId("attribute-definition-detail-key"),
    ).toHaveText("color");
  });

  test("invalid descriptor JSON surfaces an error", async ({ page }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await page.getByTestId("attribute-definition-key").fill("bad_descriptor");
    await page.getByTestId("descriptor-input").fill("{not valid json");
    await page.getByTestId("attribute-definition-submit").click();
    await expect(
      page.getByTestId("attribute-definition-error"),
    ).toContainText("invalid JSON");
  });

  test("missing descriptor on create is rejected", async ({ page }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await page.getByTestId("attribute-definition-key").fill("no_descriptor");
    await page.getByTestId("attribute-definition-submit").click();
    await expect(
      page.getByTestId("attribute-definition-error"),
    ).toContainText("descriptor is required");
  });

  // Creates its OWN definition and edits THAT one — never the seeded fixtures
  // (cuisine/seats/legacy_flag), which the list spec asserts on (shared store).
  test("edit toggles is_active on a freshly created definition", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await page.getByTestId("attribute-definition-key").fill("editable_attr");
    await page.getByTestId("descriptor-input").fill('{"type":"boolean"}');
    await page.getByTestId("attribute-definition-submit").click();
    await expect(
      page.getByTestId("attribute-definition-detail-key"),
    ).toHaveText("editable_attr");

    // Key is read-only on edit.
    await expect(
      page.getByTestId("attribute-definition-key"),
    ).toHaveAttribute("readonly", "");

    // Toggle Active off and save; the partial update must persist.
    await page.getByTestId("attribute-definition-active").uncheck();
    await page.getByTestId("attribute-definition-group").fill("misc");
    await page.getByTestId("attribute-definition-submit").click();
    // Re-open the list filtered to inactive — the edited record should appear.
    await page.goto("/attribute-definitions?is_active=false");
    await expect(
      page.getByTestId("attribute-definition-row-editable_attr"),
    ).toBeVisible();
  });
});
```

- [ ] **Step 3: Write `attribute-definitions-guards.spec.ts`**

```typescript
// tests/attribute-definitions-guards.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Attribute definitions role gating", () => {
  test("MODERATOR sees the edit form but no delete button", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/seats", {
      email: "mod@example.com",
    });
    await expect(
      page.getByTestId("attribute-definition-form"),
    ).toBeVisible();
    await expect(
      page.getByTestId("attribute-definition-delete"),
    ).toHaveCount(0);
  });

  test("ADMIN can delete a freshly created definition", async ({ page }) => {
    // Create a throwaway def, then delete THAT one — never the seeded rows the
    // alphabetically-later list spec asserts on.
    await loginAsMockAdmin(page, "/attribute-definitions/new", {
      email: "ops@example.com",
    });
    await page.getByTestId("attribute-definition-key").fill("throwaway_attr");
    await page.getByTestId("descriptor-input").fill('{"type":"string"}');
    await page.getByTestId("attribute-definition-submit").click();
    await expect(
      page.getByTestId("attribute-definition-detail-key"),
    ).toHaveText("throwaway_attr");

    page.on("dialog", (d) => d.accept());
    await expect(
      page.getByTestId("attribute-definition-delete"),
    ).toBeVisible();
    await page.getByTestId("attribute-definition-delete").click();
    await page.waitForURL("**/attribute-definitions");
    await expect(
      page.getByTestId("attribute-definition-row-throwaway_attr"),
    ).toHaveCount(0);
  });
});
```

- [ ] **Step 4: Run the new specs**

Run: `npm run test:e2e -- attribute-definitions`
Expected: all new specs PASS. If the `is_active` checkbox/hidden ordering caveat (Task 5 Step 3) surfaces — the edit-toggle test will fail by showing `editable_attr` as still-active — switch `bool()` in `actions.ts` to `formData.getAll("is_active").includes("true")` and re-run.

- [ ] **Step 5: Commit**

```bash
git add tests/attribute-definitions-list.spec.ts tests/attribute-definitions-crud.spec.ts tests/attribute-definitions-guards.spec.ts
git commit -m "test(attribute-definitions): list, crud, and role-gating e2e"
```

---

## Task 9: Whole-feature verification + PR

**Files:** none (verification + ship).

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: clean. Fix any issues, commit as `chore(attribute-definitions): lint`.

- [ ] **Step 2: Full type-check build**

Run (mock env): `npm run build`
Expected: PASS.

- [ ] **Step 3: Full e2e suite** (ensure no regression in categories/admins/etc. from the shared store)

Run: `npm run test:e2e`
Expected: all specs PASS (existing + 3 new files).

- [ ] **Step 4: Open the PR** → base `main`

```bash
git push -u origin claude/funny-goodall-78c093
gh pr create --base main --title "feat(attribute-definitions): CRUD UI for the marketplace attribute registry" --body "<summary + verification evidence + 'Mirrors categories (F8); translations deferred to F10'>"
```

- [ ] **Step 5: Self-review + CI gate.** Fetch `gh pr diff`, scan for silent failures / scope creep / copy-paste bugs (esp. lingering `category`/`id` references that should be `key`). Wait for `ci.yml` green. **Do NOT merge** until: user confirms-this-turn (base is `main`, live users) AND live smoke at admin-marketplace.speakup.ltd is green (user types the password).

---

## Self-Review (plan author)

**Spec coverage:** routes/files (Tasks 5-7), API client (Task 1), list filters + sort (Tasks 1,2,6), descriptor JSON-only (Tasks 4,5), key-as-path-param (Tasks 1,4,6), empty-PUT→400 parity (Task 3), role gating ADMIN+ delete (Tasks 3,6,8), mock store keyed-by-key (Task 2), nav (Task 7), 3 test slices (Task 8), verification (Task 9). All spec sections map to a task. ✔

**Placeholder scan:** PR body has a `<summary…>` placeholder — intentional, filled at ship time from real verification output. No code placeholders. ✔

**Type consistency:** `AttributeDefinitionRead`/`…CursorPage`/`…ListQuery`/`…MutationPayload` consistent across Tasks 1→9. Store fns (`getAttributeDefinitionByKey`, `listAttributeDefinitionsPage`, `create/update/deleteAttributeDefinitionRecord`, `AttributeDefinitionWrite`) match between Task 2 (def) and Task 3 (import). Action names (`create/update/deleteAttributeDefinitionAction`) match between Task 4 (def) and Task 5 (import). `DeleteAttributeDefinitionButton` prop is `attrKey` in both Task 5 (def) and Task 6 (use). testids consistent between components (Task 5) and tests (Task 8). ✔

**Known risk flagged inline:** the `is_active` checkbox + hidden-`false` `FormData.get` ordering (Task 5 Step 3 caveat) — has a concrete test (Task 8 edit-toggle) and a concrete fallback (`getAll(...).includes("true")`). ✔
