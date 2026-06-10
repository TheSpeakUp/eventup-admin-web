# Category↔Attribute Bindings UI (F14) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a per-category attribute-bindings CRUD UI in `eventup-admin-web`, mirroring the shipped F8/F9 CRUD template, as a sub-route under `/categories/[id]/attributes`.

**Architecture:** App-Router server components for list/new/edit pages under `src/app/(routes)/categories/[id]/attributes/`; one `"use server"` upsert action (create and edit share the backend PUT) + a delete action; typed client functions added to the existing `src/lib/categories` lib (F10 precedent: sub-resource lives in the parent domain's lib). MSW in-memory store serves Playwright e2e. Structural specifics vs F9: **PUT is a full upsert** (omitted fields fall to schema defaults, NOT "unchanged") so the form always submits all five fields; the list endpoint has **no cursor/filters** (`{items, count}`); the add flow is a two-step picker (choose an unbound active attribute definition → form prefilled from the definition).

**Tech Stack:** Next.js 16 (App Router), React 19 (`useActionState`), TypeScript, MSW, Playwright, Tailwind v4, pnpm.

**Template (read before each task):** F9 attribute-definitions is the verbatim pattern: `src/app/(routes)/attribute-definitions/`, `src/lib/attribute-definitions/`, `src/mocks/attribute-definitions-{store,fixtures}.ts`. Spec: `docs/superpowers/specs/2026-06-10-eventup-admin-category-bindings-ui-design.md`.

**Pre-code gate (AGENTS.md):** before writing component/page/action code, skim the Next 16 App-Router server-actions/forms guide under `node_modules/next/dist/docs/`; if absent, use context7 Next.js. The React 19 `<form action>` reset gotcha is solved by the key-remount idiom (reproduced below) — do not re-derive.

**Verification env (all builds/e2e):** `NEXT_PUBLIC_USE_MOCK_AUTH=true NEXT_PUBLIC_USE_MOCK_BACKEND=true NEXT_PUBLIC_API_URL=http://127.0.0.1:65535`.

**Backend contract (verified `eventup-backend` `origin/main`, `category_bindings_views.py` + `attribute_registry_admin_schemas.py`):**
- `GET /eventup-admin/v1/marketplace/categories/{category_id}/bindings` (READ, MODERATOR+) → `{items, count}` — no cursor, no filters.
- `PUT .../categories/{category_id}/bindings/{attribute_key}` (SERVICES_MODERATE, MODERATOR+) → `MarketplaceCategoryAttributeBindingRead`. **Full upsert:** body `descriptor`(dict|str, **required**), `group_name`(≤64|null, default null), `sort_order`(default 100, 0..10000), `is_visible_in_filters`(default true), `is_visible_in_card`(default true). PUT on an unbound key creates; on a bound key replaces. Omitted field = schema default, NOT "unchanged".
- `DELETE .../categories/{category_id}/bindings/{attribute_key}` (PROVIDERS_RISK, **ADMIN+**) → delete envelope.
- `Read`: `binding_id:int, category_id:int, attribute_definition_id:int, attribute_key:str, descriptor:dict, group_name:str|null, sort_order:int, is_visible_in_filters:bool, is_visible_in_card:bool, is_system:bool`.
- Unknown category or unknown attribute key → 404. `descriptor`: FE does `JSON.parse` only; backend deep-validates. Step-up is a no-op (no MFA UI).

---

## Task 1: Binding types + client (extend `src/lib/categories`)

**Files:**
- Modify: `src/lib/categories/types.ts` (append)
- Modify: `src/lib/categories/api.ts` (append)

- [ ] **Step 1: Append binding types to `types.ts`** (after `isCategorySort`, end of file):

```typescript
// ---- Category↔attribute bindings sub-resource (F14) ----

export type CategoryAttributeBindingRead = {
  binding_id: number;
  category_id: number;
  attribute_definition_id: number;
  attribute_key: string;
  descriptor: Record<string, unknown>;
  group_name: string | null;
  sort_order: number;
  is_visible_in_filters: boolean;
  is_visible_in_card: boolean;
  is_system: boolean;
};

export type CategoryAttributeBindingListResponse = {
  items: CategoryAttributeBindingRead[];
  count: number;
};

// PUT is a FULL upsert: omitted fields fall back to schema defaults on the
// backend (group_name=null, sort_order=100, flags=true) — they do NOT mean
// "unchanged". All fields are required here so the form always sends them.
export type CategoryAttributeBindingUpsertPayload = {
  descriptor: Record<string, unknown> | string;
  group_name: string | null;
  sort_order: number;
  is_visible_in_filters: boolean;
  is_visible_in_card: boolean;
};
```

- [ ] **Step 2: Append binding client fns to `api.ts`** (end of file; `BASE` already exists in this module):

```typescript
// ---- Category↔attribute bindings sub-resource (F14) ----

export function listCategoryBindings(
  categoryId: number,
): Promise<ApiFetchResult<CategoryAttributeBindingListResponse>> {
  return apiFetch<CategoryAttributeBindingListResponse>(
    `${BASE}/${categoryId}/bindings`,
  );
}

export function upsertCategoryBinding(
  categoryId: number,
  attributeKey: string,
  payload: CategoryAttributeBindingUpsertPayload,
): Promise<ApiFetchResult<CategoryAttributeBindingRead>> {
  return apiFetch<CategoryAttributeBindingRead>(
    `${BASE}/${categoryId}/bindings/${encodeURIComponent(attributeKey)}`,
    { method: "PUT", body: JSON.stringify(payload), redirectOn401: false },
  );
}

export function deleteCategoryBinding(
  categoryId: number,
  attributeKey: string,
): Promise<ApiFetchResult<{ success?: boolean; message?: string } | null>> {
  return apiFetch<{ success?: boolean; message?: string } | null>(
    `${BASE}/${categoryId}/bindings/${encodeURIComponent(attributeKey)}`,
    { method: "DELETE", redirectOn401: false },
  );
}
```

Also extend the type-only import at the top of `api.ts`:

```typescript
import type {
  CategoryAttributeBindingListResponse,
  CategoryAttributeBindingRead,
  CategoryAttributeBindingUpsertPayload,
  CategoryCursorPage,
  CategoryListQuery,
  CategoryMutationPayload,
  CategoryRead,
} from "./types";
```

- [ ] **Step 3: Type-check + commit**

Run (mock env): `pnpm build`. Expected: PASS.

```bash
git add src/lib/categories/types.ts src/lib/categories/api.ts
git commit -m "feat(category-bindings): typed API client + types"
```

---

## Task 2: Mock store + fixtures

**Files:**
- Create: `src/mocks/category-bindings-fixtures.ts`
- Create: `src/mocks/category-bindings-store.ts`

Store is keyed by `"{category_id}:{attribute_key}"`. It cross-references the existing stores: category existence via `getCategoryById` (`./categories-store`), definition lookup via `getAttributeDefinitionByKey` (`./attribute-definitions-store`) — `attribute_definition_id` and `is_system` come from the definition. Upsert = create-or-replace applying schema defaults for omitted fields (mirror backend full-upsert).

- [ ] **Step 1: Write `category-bindings-fixtures.ts`**

Seeded categories are `1 Catering / 2 Buffet Catering / 3 Venues`; seeded definitions are `cuisine(id 1) / seats(id 2) / legacy_flag(id 3)`. Bind cuisine+seats to category 1; leave categories 2 and 3 unbound (2 = mutation playground for CRUD tests, 3 = empty-state assert).

```typescript
// src/mocks/category-bindings-fixtures.ts
import type { CategoryAttributeBindingRead } from "@/lib/categories/types";

export function buildFixtureCategoryBindings(): CategoryAttributeBindingRead[] {
  return [
    {
      binding_id: 1,
      category_id: 1,
      attribute_definition_id: 1,
      attribute_key: "cuisine",
      descriptor: { type: "string", searchable: true },
      group_name: "catering",
      sort_order: 10,
      is_visible_in_filters: true,
      is_visible_in_card: true,
      is_system: false,
    },
    {
      binding_id: 2,
      category_id: 1,
      attribute_definition_id: 2,
      attribute_key: "seats",
      descriptor: { type: "integer", required: false },
      group_name: "venue",
      sort_order: 20,
      is_visible_in_filters: true,
      is_visible_in_card: false,
      is_system: false,
    },
  ];
}
```

- [ ] **Step 2: Write `category-bindings-store.ts`**

```typescript
// src/mocks/category-bindings-store.ts
import type { CategoryAttributeBindingRead } from "@/lib/categories/types";
import { getAttributeDefinitionByKey } from "./attribute-definitions-store";
import { getCategoryById } from "./categories-store";
import { buildFixtureCategoryBindings } from "./category-bindings-fixtures";

// Keyed by "{category_id}:{attribute_key}" — the backend's natural upsert key.
const bindings = new Map<string, CategoryAttributeBindingRead>();
let nextBindingId = 100;

function bindingKey(categoryId: number, attributeKey: string): string {
  return `${categoryId}:${attributeKey}`;
}

function ensureSeed(): void {
  if (bindings.size > 0) return;
  for (const b of buildFixtureCategoryBindings())
    bindings.set(bindingKey(b.category_id, b.attribute_key), b);
}

export function resetCategoryBindingsStore(): void {
  bindings.clear();
  nextBindingId = 100;
  ensureSeed();
}

// null → unknown category (404). Sorting is the page's job (client-side).
export function listCategoryBindingRecords(
  categoryId: number,
): CategoryAttributeBindingRead[] | null {
  ensureSeed();
  if (!getCategoryById(categoryId)) return null;
  return Array.from(bindings.values()).filter(
    (b) => b.category_id === categoryId,
  );
}

export type CategoryBindingWrite = {
  descriptor?: Record<string, unknown>;
  group_name?: string | null;
  sort_order?: number;
  is_visible_in_filters?: boolean;
  is_visible_in_card?: boolean;
};

// Full upsert: omitted fields take schema defaults (NOT previous values) —
// mirrors the backend MarketplaceCategoryAttributeBindingUpsertRequest.
// null → unknown category or unknown attribute key (404).
export function upsertCategoryBindingRecord(
  categoryId: number,
  attributeKey: string,
  input: CategoryBindingWrite,
): CategoryAttributeBindingRead | null {
  ensureSeed();
  if (!getCategoryById(categoryId)) return null;
  const definition = getAttributeDefinitionByKey(attributeKey);
  if (!definition) return null;
  const k = bindingKey(categoryId, attributeKey);
  const existing = bindings.get(k);
  const record: CategoryAttributeBindingRead = {
    binding_id: existing?.binding_id ?? nextBindingId++,
    category_id: categoryId,
    attribute_definition_id: definition.id,
    attribute_key: attributeKey,
    descriptor: input.descriptor ?? {},
    group_name: input.group_name ?? null,
    sort_order: input.sort_order ?? 100,
    is_visible_in_filters: input.is_visible_in_filters ?? true,
    is_visible_in_card: input.is_visible_in_card ?? true,
    is_system: definition.is_system,
  };
  bindings.set(k, record);
  return record;
}

export function deleteCategoryBindingRecord(
  categoryId: number,
  attributeKey: string,
): boolean {
  ensureSeed();
  return bindings.delete(bindingKey(categoryId, attributeKey));
}
```

- [ ] **Step 3: Type-check + commit**

Run (mock env): `pnpm build`. Expected: PASS.

```bash
git add src/mocks/category-bindings-fixtures.ts src/mocks/category-bindings-store.ts
git commit -m "feat(category-bindings): MSW in-memory store + fixtures"
```

---

## Task 3: Mock handlers

**Files:**
- Modify: `src/mocks/handlers.ts`

3 handlers under the existing `CATEGORIES_BASE` (defined near line 146). Existing `GET/PUT ${CATEGORIES_BASE}/:id` patterns match exactly one path segment, so `/:id/bindings` does NOT collide — placement is order-safe; still, put the new block right after the categories `http.delete(...)` slice for readability. Gating mirror: GET+PUT need any admin role (all mock roles hold MODERATE), DELETE gates ADMIN+ via the existing `operatorRole` helper (line ~200).

- [ ] **Step 1: Add store imports** next to the `./categories-store` import block:

```typescript
import {
  deleteCategoryBindingRecord,
  listCategoryBindingRecords,
  upsertCategoryBindingRecord,
  type CategoryBindingWrite,
} from "./category-bindings-store";
```

- [ ] **Step 2: Add the body normalizer** next to the existing `toAttributeDefinitionWrite` helper:

```typescript
// Pick known binding keys from an untyped JSON body. The server action already
// validated/coerced each field; here we only keep typed keys.
function toCategoryBindingWrite(
  body: Record<string, unknown>,
): CategoryBindingWrite {
  const out: CategoryBindingWrite = {};
  if (typeof body.descriptor === "object" && body.descriptor !== null)
    out.descriptor = body.descriptor as Record<string, unknown>;
  if (typeof body.group_name === "string" || body.group_name === null)
    out.group_name = body.group_name as string | null;
  if (typeof body.sort_order === "number") out.sort_order = body.sort_order;
  if (typeof body.is_visible_in_filters === "boolean")
    out.is_visible_in_filters = body.is_visible_in_filters;
  if (typeof body.is_visible_in_card === "boolean")
    out.is_visible_in_card = body.is_visible_in_card;
  return out;
}
```

- [ ] **Step 3: Add the 3 handlers** immediately after the categories `http.delete(...)` block, inside the `handlers` array:

```typescript
  // ---- Marketplace category↔attribute bindings (F14) ----
  http.get(`${CATEGORIES_BASE}/:id/bindings`, ({ params }) => {
    const rows = listCategoryBindingRecords(Number(params.id));
    if (rows === null)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json({ items: rows, count: rows.length });
  }),
  http.put(
    `${CATEGORIES_BASE}/:id/bindings/:key`,
    async ({ params, request }) => {
      const body = (await request.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      const write = toCategoryBindingWrite(body);
      // Backend requires descriptor on the upsert request (422 there; 400 here
      // is close enough for the UI's generic envelope handling).
      if (write.descriptor === undefined) {
        return HttpResponse.json(
          {
            error: {
              message: "Request cannot be processed",
              meta: { original_detail: "descriptor is required" },
            },
          },
          { status: 400 },
        );
      }
      const updated = upsertCategoryBindingRecord(
        Number(params.id),
        String(params.key),
        write,
      );
      if (!updated)
        return HttpResponse.json({ detail: "Not found" }, { status: 404 });
      return HttpResponse.json(updated);
    },
  ),
  http.delete(`${CATEGORIES_BASE}/:id/bindings/:key`, ({ params, request }) => {
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
    const ok = deleteCategoryBindingRecord(
      Number(params.id),
      String(params.key),
    );
    if (!ok) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return new HttpResponse(null, { status: 204 });
  }),
```

- [ ] **Step 4: Type-check + commit**

Run (mock env): `pnpm build`. Expected: PASS.

```bash
git add src/mocks/handlers.ts
git commit -m "feat(category-bindings): MSW handlers for list/upsert/delete"
```

---

## Task 4: Server actions + action-types

**Files:**
- Create: `src/app/(routes)/categories/[id]/attributes/action-types.ts`
- Create: `src/app/(routes)/categories/[id]/attributes/actions.ts`

One upsert action serves both create and edit (same backend PUT). The form always submits ALL five payload fields (full-upsert semantics). Checkbox values are read with `formData.getAll(...).includes("true")` — the hidden-`false`-sentinel pattern (F9 final form, NOT the `get()` variant from the F9 plan draft).

- [ ] **Step 1: Write `action-types.ts`**

```typescript
// src/app/(routes)/categories/[id]/attributes/action-types.ts
export type ActionState =
  | { ok: true; error: null }
  | { ok: false; error: string };
export const EMPTY_STATE: ActionState = { ok: true, error: null };
```

- [ ] **Step 2: Write `actions.ts`**

```typescript
// src/app/(routes)/categories/[id]/attributes/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteCategoryBinding,
  upsertCategoryBinding,
} from "@/lib/categories/api";
import type { CategoryAttributeBindingUpsertPayload } from "@/lib/categories/types";
import type { ActionState } from "./action-types";

function fail(message: string): ActionState {
  return { ok: false, error: message };
}

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

// Hidden "false" sentinel + checkbox "true": checked → ["false","true"],
// unchecked → ["false"]. Order-independent membership check.
function flag(formData: FormData, key: string): boolean {
  return formData.getAll(key).includes("true");
}

function ids(formData: FormData):
  | { ok: true; categoryId: number; attributeKey: string }
  | { ok: false; error: string } {
  const rawId = str(formData, "category_id");
  const categoryId = Number(rawId);
  if (!rawId || !Number.isInteger(categoryId) || categoryId < 1)
    return { ok: false, error: "Invalid category id" };
  const attributeKey = str(formData, "attribute_key");
  if (!attributeKey) return { ok: false, error: "Invalid attribute key" };
  return { ok: true, categoryId, attributeKey };
}

export async function upsertBindingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const target = ids(formData);
  if (!target.ok) return fail(target.error);

  // descriptor: JSON.parse only; required (PUT is a full upsert — backend
  // rejects a missing descriptor). Backend deep-validates the shape.
  const descRaw = formData.get("descriptor");
  const descStr = typeof descRaw === "string" ? descRaw.trim() : "";
  if (descStr === "") return fail("descriptor is required");
  let descriptor: Record<string, unknown> | string;
  try {
    descriptor = JSON.parse(descStr) as Record<string, unknown> | string;
  } catch {
    return fail("descriptor: invalid JSON");
  }

  const group = str(formData, "group_name");
  if (group !== undefined && group.length > 64)
    return fail("Group name must be at most 64 characters");

  const sortRaw = str(formData, "sort_order");
  const sortOrder = Number(sortRaw ?? "100");
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000)
    return fail("Sort order must be an integer 0–10000");

  // Full payload, always: omitted fields would silently reset to defaults.
  const payload: CategoryAttributeBindingUpsertPayload = {
    descriptor,
    group_name: group ?? null,
    sort_order: sortOrder,
    is_visible_in_filters: flag(formData, "is_visible_in_filters"),
    is_visible_in_card: flag(formData, "is_visible_in_card"),
  };

  const result = await upsertCategoryBinding(
    target.categoryId,
    target.attributeKey,
    payload,
  );
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath(`/categories/${target.categoryId}/attributes`);
  redirect(`/categories/${target.categoryId}/attributes`);
}

export async function deleteBindingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const target = ids(formData);
  if (!target.ok) return fail(target.error);
  const result = await deleteCategoryBinding(
    target.categoryId,
    target.attributeKey,
  );
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath(`/categories/${target.categoryId}/attributes`);
  redirect(`/categories/${target.categoryId}/attributes`);
}
```

- [ ] **Step 3: Type-check + commit**

Run (mock env): `pnpm build`. Expected: PASS.

```bash
git add "src/app/(routes)/categories/[id]/attributes/action-types.ts" "src/app/(routes)/categories/[id]/attributes/actions.ts"
git commit -m "feat(category-bindings): upsert + delete server actions"
```

---

## Task 5: Components

**Files:**
- Create: `src/app/(routes)/categories/[id]/attributes/_components/BindingsTable.tsx`
- Create: `src/app/(routes)/categories/[id]/attributes/_components/BindingForm.tsx`
- Create: `src/app/(routes)/categories/[id]/attributes/_components/DeleteBindingButton.tsx`

`DescriptorEditor` is REUSED via import from the attribute-definitions feature (`@/app/(routes)/attribute-definitions/_components/DescriptorEditor`) — identical raw-JSON-textarea need, zero new code; its testid stays `descriptor-input`.

- [ ] **Step 1: Write `BindingsTable.tsx`**

```typescript
// src/app/(routes)/categories/[id]/attributes/_components/BindingsTable.tsx
import Link from "next/link";
import type { CategoryAttributeBindingRead } from "@/lib/categories/types";

export function BindingsTable({
  categoryId,
  rows,
}: {
  categoryId: number;
  rows: CategoryAttributeBindingRead[];
}) {
  if (rows.length === 0)
    return (
      <p data-testid="bindings-empty" className="p-4 text-gray-500">
        No attributes bound to this category yet.
      </p>
    );
  return (
    <table className="w-full text-sm" data-testid="bindings-table">
      <thead>
        <tr className="text-left text-gray-500">
          <th className="py-2">Attribute</th>
          <th>Group</th>
          <th>Sort</th>
          <th>In filters</th>
          <th>In card</th>
          <th>System</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.attribute_key}
            className="border-t"
            data-testid={`binding-row-${r.attribute_key}`}
          >
            <td className="py-2">{r.attribute_key}</td>
            <td>{r.group_name ?? "—"}</td>
            <td>{r.sort_order}</td>
            <td>{r.is_visible_in_filters ? "yes" : "no"}</td>
            <td>{r.is_visible_in_card ? "yes" : "no"}</td>
            <td>{r.is_system ? "yes" : "no"}</td>
            <td>
              <Link
                href={`/categories/${categoryId}/attributes/${encodeURIComponent(r.attribute_key)}`}
                data-testid={`binding-edit-${r.attribute_key}`}
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

- [ ] **Step 2: Write `BindingForm.tsx`** (one form for create and edit — same upsert action; `category_id` + `attribute_key` ride as hidden fields; always submits all five payload fields):

```typescript
// src/app/(routes)/categories/[id]/attributes/_components/BindingForm.tsx
"use client";
import { useActionState } from "react";
import { DescriptorEditor } from "@/app/(routes)/attribute-definitions/_components/DescriptorEditor";
import { upsertBindingAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

export type BindingFormInitial = {
  descriptor: Record<string, unknown>;
  group_name: string | null;
  sort_order: number;
  is_visible_in_filters: boolean;
  is_visible_in_card: boolean;
};

export function BindingForm({
  categoryId,
  attributeKey,
  initial,
  submitLabel,
}: {
  categoryId: number;
  attributeKey: string;
  initial: BindingFormInitial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    upsertBindingAction,
    EMPTY_STATE,
  );
  return (
    <form action={formAction} data-testid="binding-form" className="space-y-4">
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="attribute_key" value={attributeKey} />

      <label className="block">
        <span className="text-sm font-medium">Attribute key</span>
        <input
          data-testid="binding-key"
          value={attributeKey}
          readOnly
          className="mt-1 w-full rounded border px-2 py-1 read-only:bg-zinc-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Group name</span>
        <input
          name="group_name"
          data-testid="binding-group"
          defaultValue={initial.group_name ?? ""}
          className="mt-1 w-full rounded border px-2 py-1"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Sort order</span>
        <input
          name="sort_order"
          type="number"
          data-testid="binding-sort"
          defaultValue={initial.sort_order}
          className="mt-1 w-32 rounded border px-2 py-1"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_visible_in_filters"
          value="true"
          data-testid="binding-visible-filters"
          defaultChecked={initial.is_visible_in_filters}
        />
        <span className="text-sm font-medium">Visible in filters</span>
      </label>
      {/* Hidden "false" sentinel so an unchecked box still submits the field;
          the action reads getAll(...).includes("true"). */}
      <input type="hidden" name="is_visible_in_filters" value="false" />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_visible_in_card"
          value="true"
          data-testid="binding-visible-card"
          defaultChecked={initial.is_visible_in_card}
        />
        <span className="text-sm font-medium">Visible in card</span>
      </label>
      <input type="hidden" name="is_visible_in_card" value="false" />

      <DescriptorEditor initial={initial.descriptor} />

      <button
        type="submit"
        disabled={pending}
        data-testid="binding-submit"
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="binding-error" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
```

- [ ] **Step 3: Write `DeleteBindingButton.tsx`**

```typescript
// src/app/(routes)/categories/[id]/attributes/_components/DeleteBindingButton.tsx
"use client";
import { useActionState } from "react";
import { deleteBindingAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

export function DeleteBindingButton({
  categoryId,
  attributeKey,
}: {
  categoryId: number;
  attributeKey: string;
}) {
  const [state, formAction, pending] = useActionState(
    deleteBindingAction,
    EMPTY_STATE,
  );
  return (
    <form
      action={formAction}
      data-testid="binding-delete-form"
      onSubmit={(e) => {
        if (!confirm("Unbind this attribute from the category?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="attribute_key" value={attributeKey} />
      <button
        type="submit"
        disabled={pending}
        data-testid="binding-delete"
        className="rounded border border-red-300 px-4 py-2 text-red-700"
      >
        {pending ? "Deleting…" : "Delete binding"}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="binding-delete-error" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
```

- [ ] **Step 4: Type-check + commit**

Run (mock env): `pnpm build`. Expected: PASS.

```bash
git add "src/app/(routes)/categories/[id]/attributes/_components"
git commit -m "feat(category-bindings): table, form, delete button components"
```

---

## Task 6: Pages (list / new / edit) + entry link

**Files:**
- Create: `src/app/(routes)/categories/[id]/attributes/page.tsx`
- Create: `src/app/(routes)/categories/[id]/attributes/new/page.tsx`
- Create: `src/app/(routes)/categories/[id]/attributes/[key]/page.tsx`
- Modify: `src/app/(routes)/categories/[id]/page.tsx`

- [ ] **Step 1: Write the list `page.tsx`** (fetch bindings + category name; client-side sort by `sort_order` then key — the API has no sort):

```typescript
// src/app/(routes)/categories/[id]/attributes/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, listCategoryBindings } from "@/lib/categories/api";
import { BindingsTable } from "./_components/BindingsTable";

export default async function CategoryBindingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  const [catRes, bindingsRes] = await Promise.all([
    getCategory(numId),
    listCategoryBindings(numId),
  ]);

  if (catRes.status === 404 || bindingsRes.status === 404) notFound();
  if (!catRes.ok || !bindingsRes.ok) {
    const failed = !catRes.ok ? catRes : bindingsRes;
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Category attributes</h1>
        <div
          data-testid="bindings-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {failed.status === 403
            ? "Viewing category attributes requires an admin role."
            : `Failed to load bindings: ${failed.message}`}
        </div>
      </div>
    );
  }

  const rows = [...bindingsRes.data.items].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      a.attribute_key.localeCompare(b.attribute_key),
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            data-testid="bindings-category-name"
          >
            {catRes.data.name} — attributes
          </h1>
          <Link
            href={`/categories/${numId}`}
            className="text-sm text-blue-700"
          >
            ← Back to category
          </Link>
        </div>
        <Link
          href={`/categories/${numId}/attributes/new`}
          data-testid="binding-new"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Add attribute
        </Link>
      </div>
      <div className="mt-4">
        <BindingsTable categoryId={numId} rows={rows} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `new/page.tsx`** — two-step add on one server page via `?key=` searchParam:

```typescript
// src/app/(routes)/categories/[id]/attributes/new/page.tsx
import { notFound, redirect } from "next/navigation";
import {
  getAttributeDefinition,
  listAttributeDefinitions,
} from "@/lib/attribute-definitions/api";
import { getCategory, listCategoryBindings } from "@/lib/categories/api";
import { BindingForm } from "../_components/BindingForm";

export default async function NewBindingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  const sp = await searchParams;
  const [catRes, bindingsRes] = await Promise.all([
    getCategory(numId),
    listCategoryBindings(numId),
  ]);

  if (catRes.status === 404 || bindingsRes.status === 404) notFound();
  if (!catRes.ok || !bindingsRes.ok) {
    const failed = !catRes.ok ? catRes : bindingsRes;
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Add attribute</h1>
        <div
          data-testid="bindings-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {failed.status === 403
            ? "Managing category attributes requires an admin role."
            : `Failed to load: ${failed.message}`}
        </div>
      </div>
    );
  }

  const bound = new Set(bindingsRes.data.items.map((b) => b.attribute_key));

  // Step 1 — no key selected yet: pick an unbound active definition.
  // Known cap: only the first 100 active definitions appear (fine at current
  // scale; picker pagination is out of scope per the spec).
  if (!sp.key) {
    const defsRes = await listAttributeDefinitions({
      is_active: true,
      limit: 100,
    });
    const options = defsRes.ok
      ? defsRes.data.items.filter((d) => !bound.has(d.key))
      : [];
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">
          Add attribute to {catRes.data.name}
        </h1>
        {/* GET form: submitting re-renders this page with ?key=<selection>. */}
        <form method="GET" className="mt-4 flex max-w-2xl items-end gap-2">
          <label className="block grow">
            <span className="text-sm font-medium">Attribute definition</span>
            <select
              name="key"
              required
              data-testid="binding-key-select"
              className="mt-1 w-full rounded border px-2 py-1"
            >
              {options.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.key}
                  {d.group_name ? ` (${d.group_name})` : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            data-testid="binding-picker-continue"
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Continue
          </button>
        </form>
        {options.length === 0 ? (
          <p data-testid="binding-picker-empty" className="mt-4 text-gray-500">
            No unbound active attribute definitions available.
          </p>
        ) : null}
      </div>
    );
  }

  // Step 2 — key chosen: prefill the binding form from the definition.
  if (bound.has(sp.key)) {
    // Already bound — go edit instead of silently overwriting via upsert.
    redirect(
      `/categories/${numId}/attributes/${encodeURIComponent(sp.key)}`,
    );
  }
  const defRes = await getAttributeDefinition(sp.key);
  if (defRes.status === 404) notFound();
  if (!defRes.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Add attribute</h1>
        <div
          data-testid="bindings-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {`Failed to load attribute definition: ${defRes.message}`}
        </div>
      </div>
    );
  }
  const def = defRes.data;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">
        Bind “{def.key}” to {catRes.data.name}
      </h1>
      <div className="mt-4 max-w-2xl">
        <BindingForm
          categoryId={numId}
          attributeKey={def.key}
          initial={{
            descriptor: def.descriptor,
            group_name: def.group_name,
            sort_order: def.sort_order,
            is_visible_in_filters: true,
            is_visible_in_card: true,
          }}
          submitLabel="Bind attribute"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `[key]/page.tsx`** — edit; **no GET-by-key binding endpoint** → find in the list (F13 reconstruct-from-list precedent); delete gated ADMIN+; key-remount idiom:

```typescript
// src/app/(routes)/categories/[id]/attributes/[key]/page.tsx
import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { listCategoryBindings } from "@/lib/categories/api";
import { BindingForm } from "../_components/BindingForm";
import { DeleteBindingButton } from "../_components/DeleteBindingButton";

export default async function BindingDetailPage({
  params,
}: {
  params: Promise<{ id: string; key: string }>;
}) {
  const { id, key } = await params;
  const numId = Number(id);
  const decodedKey = decodeURIComponent(key);
  const [bindingsRes, session] = await Promise.all([
    listCategoryBindings(numId),
    getAdminSession(),
  ]);

  if (bindingsRes.status === 404) notFound();
  if (!bindingsRes.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Category attribute</h1>
        <div
          data-testid="bindings-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {bindingsRes.status === 403
            ? "Managing category attributes requires an admin role."
            : `Failed to load bindings: ${bindingsRes.message}`}
        </div>
      </div>
    );
  }

  // No GET-by-key binding endpoint — reconstruct from the list (F13 precedent).
  const binding = bindingsRes.data.items.find(
    (b) => b.attribute_key === decodedKey,
  );
  if (!binding) notFound();

  // Delete requires ADMIN_MARKETPLACE_PROVIDERS_RISK → ADMIN or SUPERADMIN.
  const canDelete =
    session?.role === "ADMIN" || session?.role === "SUPERADMIN";

  // Key-remount so revalidated server values reset the uncontrolled form
  // (React 19 <form action> reset gotcha — see PR #18).
  const formKey = `${binding.binding_id}:${binding.sort_order}:${binding.group_name}:${binding.is_visible_in_filters}:${binding.is_visible_in_card}`;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold" data-testid="binding-detail-key">
        {binding.attribute_key}
      </h1>
      <div className="mt-4 max-w-2xl space-y-6">
        <BindingForm
          key={formKey}
          categoryId={numId}
          attributeKey={binding.attribute_key}
          initial={{
            descriptor: binding.descriptor,
            group_name: binding.group_name,
            sort_order: binding.sort_order,
            is_visible_in_filters: binding.is_visible_in_filters,
            is_visible_in_card: binding.is_visible_in_card,
          }}
          submitLabel="Save"
        />
        {canDelete ? (
          <DeleteBindingButton
            categoryId={numId}
            attributeKey={binding.attribute_key}
          />
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add the entry link** in `src/app/(routes)/categories/[id]/page.tsx`. Add `import Link from "next/link";` at the top, then insert the link right after the `<h1>` block:

```typescript
      <Link
        href={`/categories/${category.id}/attributes`}
        data-testid="category-attributes-link"
        className="mt-1 inline-block text-sm text-blue-700"
      >
        Manage attributes →
      </Link>
```

- [ ] **Step 5: Type-check + commit**

Run (mock env): `pnpm build`. Expected: PASS.

```bash
git add "src/app/(routes)/categories/[id]/attributes" "src/app/(routes)/categories/[id]/page.tsx"
git commit -m "feat(category-bindings): list, add (picker+prefill), edit pages + entry link"
```

---

## Task 7: E2E tests

**Files:**
- Create: `tests/category-bindings-list.spec.ts`
- Create: `tests/category-bindings-crud.spec.ts`
- Create: `tests/category-bindings-guards.spec.ts`

**Isolation rule (critical):** the e2e run shares ONE in-memory store across all spec files (single `next start`, workers:1, no per-test reset; alphabetical file order — note `categories-*.spec.ts` sorts BEFORE `category-bindings-*.spec.ts`). Fixtures the list spec asserts on: bindings `cuisine`+`seats` on **category 1**, **category 3 empty**. Mutation tests therefore (a) create their OWN attribute definitions (`f14_*` keys), (b) bind/edit/delete them on **category 2** only, (c) never touch category 1/3 bindings. Guards may READ category 1's seeded `cuisine` binding but never save/delete it.

- [ ] **Step 1: Write `category-bindings-list.spec.ts`**

```typescript
// tests/category-bindings-list.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Category bindings list", () => {
  test("renders seeded bindings with flag columns", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/1/attributes");
    await expect(page.getByTestId("bindings-table")).toBeVisible();
    await expect(page.getByTestId("binding-row-cuisine")).toBeVisible();
    const seats = page.getByTestId("binding-row-seats");
    await expect(seats).toBeVisible();
    // seats is seeded is_visible_in_card=false → its card cell reads "no".
    await expect(seats).toContainText("no");
  });

  test("empty state on a category with no bindings", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/3/attributes");
    await expect(page.getByTestId("bindings-empty")).toBeVisible();
  });

  test("unknown category renders 404", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/99999/attributes");
    await expect(
      page.getByText("This page could not be found"),
    ).toBeVisible();
  });

  test("category detail links to the bindings page", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/1");
    await page.getByTestId("category-attributes-link").click();
    await page.waitForURL("**/categories/1/attributes");
    await expect(page.getByTestId("bindings-table")).toBeVisible();
  });
});
```

- [ ] **Step 2: Write `category-bindings-crud.spec.ts`**

```typescript
// tests/category-bindings-crud.spec.ts
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

// Create an OWN attribute definition (never bind seeded defs — the picker
// exclusion + list fixtures belong to other specs). Shared-store rule: all
// binding mutations happen on category 2 only.
async function createDefinition(
  page: Page,
  key: string,
  descriptor: string,
): Promise<void> {
  await page.goto("/attribute-definitions/new");
  await page.getByTestId("attribute-definition-key").fill(key);
  await page.getByTestId("descriptor-input").fill(descriptor);
  await page.getByTestId("attribute-definition-submit").click();
  await expect(
    page.getByTestId("attribute-definition-detail-key"),
  ).toHaveText(key);
}

test.describe("Category bindings CRUD", () => {
  test("picker excludes already-bound keys", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/1/attributes/new");
    await expect(page.getByTestId("binding-key-select")).toBeVisible();
    // cuisine + seats are seeded as bound to category 1.
    await expect(
      page.locator('[data-testid="binding-key-select"] option[value="cuisine"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('[data-testid="binding-key-select"] option[value="seats"]'),
    ).toHaveCount(0);
  });

  test("add binding: picker → prefilled form → row appears", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await createDefinition(
      page,
      "f14_crud_attr",
      '{"type":"string","searchable":true}',
    );

    await page.goto("/categories/2/attributes/new");
    await page
      .getByTestId("binding-key-select")
      .selectOption("f14_crud_attr");
    await page.getByTestId("binding-picker-continue").click();

    // Form is prefilled from the definition's descriptor.
    await expect(page.getByTestId("descriptor-input")).toHaveValue(
      /searchable/,
    );
    await page.getByTestId("binding-submit").click();
    await page.waitForURL("**/categories/2/attributes");
    await expect(
      page.getByTestId("binding-row-f14_crud_attr"),
    ).toBeVisible();
  });

  test("edit persists sort_order and card flag across navigation", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await createDefinition(page, "f14_edit_attr", '{"type":"integer"}');

    // Bind it to category 2 first.
    await page.goto("/categories/2/attributes/new?key=f14_edit_attr");
    await page.getByTestId("binding-submit").click();
    await page.waitForURL("**/categories/2/attributes");

    // Edit: sort 100→7, uncheck "Visible in card", save.
    await page.getByTestId("binding-edit-f14_edit_attr").click();
    await page.getByTestId("binding-sort").fill("7");
    await page.getByTestId("binding-visible-card").uncheck();
    await page.getByTestId("binding-submit").click();
    await page.waitForURL("**/categories/2/attributes");

    // Re-open the edit page — values must have persisted (full upsert).
    await page.getByTestId("binding-edit-f14_edit_attr").click();
    await expect(page.getByTestId("binding-sort")).toHaveValue("7");
    await expect(page.getByTestId("binding-visible-card")).not.toBeChecked();
    await expect(page.getByTestId("binding-visible-filters")).toBeChecked();
  });

  test("invalid descriptor JSON surfaces an action error", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await createDefinition(page, "f14_bad_json_attr", '{"type":"string"}');

    await page.goto("/categories/2/attributes/new?key=f14_bad_json_attr");
    await page.getByTestId("descriptor-input").fill("{not valid json");
    await page.getByTestId("binding-submit").click();
    await expect(page.getByTestId("binding-error")).toContainText(
      "invalid JSON",
    );
  });

  test("delete unbinds with confirm", async ({ page }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await createDefinition(page, "f14_del_attr", '{"type":"boolean"}');

    await page.goto("/categories/2/attributes/new?key=f14_del_attr");
    await page.getByTestId("binding-submit").click();
    await page.waitForURL("**/categories/2/attributes");

    await page.getByTestId("binding-edit-f14_del_attr").click();
    page.on("dialog", (d) => d.accept());
    await page.getByTestId("binding-delete").click();
    await page.waitForURL("**/categories/2/attributes");
    await expect(page.getByTestId("binding-row-f14_del_attr")).toHaveCount(0);
  });
});
```

- [ ] **Step 3: Write `category-bindings-guards.spec.ts`**

```typescript
// tests/category-bindings-guards.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Category bindings role gating", () => {
  test("MODERATOR sees the edit form but no delete button", async ({
    page,
  }) => {
    // Read-only render assert on the seeded category-1 cuisine binding —
    // never save or delete it (the list spec asserts on it).
    await loginAsMockAdmin(page, "/categories/1/attributes/cuisine", {
      email: "mod@example.com",
    });
    await expect(page.getByTestId("binding-form")).toBeVisible();
    await expect(page.getByTestId("binding-delete")).toHaveCount(0);
  });

  test("MODERATOR sees the Add attribute button", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/1/attributes", {
      email: "mod@example.com",
    });
    await expect(page.getByTestId("binding-new")).toBeVisible();
  });

  test("ADMIN sees the delete button on a binding", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/1/attributes/cuisine", {
      email: "ops@example.com",
    });
    await expect(page.getByTestId("binding-delete")).toBeVisible();
  });
});
```

- [ ] **Step 4: Run the new specs**

Run: `pnpm test:e2e -- category-bindings`
Expected: all new specs PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/category-bindings-list.spec.ts tests/category-bindings-crud.spec.ts tests/category-bindings-guards.spec.ts
git commit -m "test(category-bindings): list, crud, and role-gating e2e"
```

---

## Task 8: Whole-feature verification + PR

**Files:** none (verification + ship).

- [ ] **Step 1: Lint**

Run: `pnpm lint`
Expected: clean. Fix any issues, commit as `chore(category-bindings): lint`.

- [ ] **Step 2: Full type-check build**

Run (mock env): `pnpm build`
Expected: PASS.

- [ ] **Step 3: Full e2e suite** (no regression in categories / attribute-definitions specs from the shared store)

Run: `pnpm test:e2e`
Expected: all specs PASS (existing + 3 new files).

- [ ] **Step 4: Open the PR** → base `main`

```bash
git push -u origin claude/pedantic-solomon-bc1303
gh pr create --base main --title "feat(category-bindings): F14 — per-category attribute bindings UI" --body "<summary + verification evidence + 'Mirrors F8/F9 CRUD template; sub-route under /categories/[id]/attributes'>"
```

- [ ] **Step 5: Self-review + CI gate.** Fetch `gh pr diff`, scan for silent failures / scope creep / copy-paste bugs (esp. lingering `attribute-definitions` references that should be binding-scoped, and any payload built without all five fields — the full-upsert trap). Wait for `ci.yml` green. **Do NOT merge** until: user confirms-this-turn (base is `main`, live users) AND live smoke at admin-marketplace.speakup.ltd is green (user types the password).

---

## Self-Review (plan author)

**Spec coverage:** routes/files incl. two-step picker + prefill + already-bound redirect (Task 6), API client in parent lib (Task 1), full-upsert payload always complete (Tasks 1, 4, form in 5), no-cursor list + client-side sort (Tasks 1, 6), descriptor JSON-only via reused DescriptorEditor (Task 5), reconstruct-from-list edit page + notFound (Task 6), role gating ADMIN+ delete (Tasks 3, 6, 7), mock store keyed by (category, key) with cross-store 404s (Tasks 2, 3), entry link on category detail (Task 6), 3 test slices + isolation choreography (Task 7), verification + ship gates (Task 8). All spec sections map to a task. ✔

**Placeholder scan:** PR body `<summary…>` is intentional (filled at ship time). No code placeholders. ✔

**Type consistency:** `CategoryAttributeBindingRead`/`…ListResponse`/`…UpsertPayload` consistent Task 1→2→3→4→5→6. Store fns (`listCategoryBindingRecords`, `upsertCategoryBindingRecord`, `deleteCategoryBindingRecord`, `CategoryBindingWrite`) match between Task 2 (def) and Task 3 (import). Action names (`upsertBindingAction`, `deleteBindingAction`) match Task 4 (def) and Task 5 (import). `BindingForm` props (`categoryId`, `attributeKey`, `initial`, `submitLabel`) match Task 5 (def) and Task 6 (use). testids consistent between Tasks 5/6 (components/pages) and Task 7 (tests). ✔

**Known risks flagged inline:** full-upsert trap (form must always send all five fields — encoded in the payload type's required fields + Task 8 self-review item); alphabetical spec-order choreography with shared store (Task 7 header); picker 100-cap (Task 6 comment, spec out-of-scope). ✔
