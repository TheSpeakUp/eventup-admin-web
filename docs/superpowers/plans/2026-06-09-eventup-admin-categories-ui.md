# EventUp Admin — Categories Content-Management UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship full CRUD admin UI for marketplace categories (list/search/sort, create, edit, delete) including a translations editor and a raw-JSON `attribute_schema` editor, against the live `/eventup-admin/v1/marketplace/categories/*` backend, mirroring the existing `admins`/`providers` SPA patterns.

**Architecture:** Next.js 16 App Router. Server components fetch via a thin `src/lib/categories` client (`apiFetch`). Mutations go through `"use server"` actions (Zod-validated FormData → `ApiFetchResult` → `ActionState`), client forms use `useActionState` with a `key`-remount reset. e2e runs against MSW handlers + an in-memory `categories-store`. No unit-test runner in this repo — the test gate is Playwright e2e.

**Tech Stack:** Next 16.2.7, React 19.2.4, TypeScript, Zod 4.4.3, MSW 2.14.6, jose 6, Tailwind v4, Playwright, pnpm.

---

## Spec
`docs/superpowers/specs/2026-06-09-eventup-admin-categories-ui-design.md`. Read it first.

## Pre-flight (do before Task 1)

- [ ] **Read the Next 16 guide** per AGENTS.md. Run: `ls node_modules/next/dist/docs/ 2>/dev/null`. If it lists files, read the App Router server-actions / forms guide. If empty/absent, fall back to context7 (`mcp__plugin_context7_context7__resolve-library-id` "next.js" → `query-docs` for "App Router server actions form useActionState"). Heed the React 19 uncontrolled `<form action>` reset note (handled via `key`-remount below — same fix as PR #18).
- [ ] **Confirm branch.** This work runs on the worktree branch `claude/tender-meitner-983825`. Final PR targets `main` (auto-deploys; needs explicit user confirm to merge).

## Backend contract (frozen reference — see spec for full detail)

Namespace `/eventup-admin/v1/marketplace`. ID = `int`.
- `POST /categories/list` — body `MarketplaceCategoryFilter` `{search?, last_id?, limit=50 (1..100), sort?}`; `sort ∈ {"sort_order_asc","sort_order_desc","name_asc","name_desc"}`. Returns `{items: MarketplaceCategoryRead[], next_last_id: int|null, has_more: bool, count: int}`.
- `GET /categories/{id}` → `MarketplaceCategoryRead`.
- `POST /categories` → 201 `MarketplaceCategoryRead`.
- `PUT /categories/{id}` → `MarketplaceCategoryRead` (omitted fields unchanged).
- `DELETE /categories/{id}` → `AdminV2MarketplaceDeleteResponse` `{success, message_key?, message}` (or 204-ish; treat any 2xx as success).

`MarketplaceCategoryRead`: `id, name, slug, icon|null, description|null, sort_order, parent_id|null, is_leaf, attribute_schema|null, publication_currency|null, publication_price_monthly|null, publication_price_monthly_discounted|null`.

Create/Update payload fields: `name, slug, icon?, description?, name_translations?(dict), description_translations?(dict), sort_order?(0..10000), parent_id?(≥1), attribute_schema?(dict), publication_currency?(3..10), publication_price_monthly?(≥0), publication_price_monthly_discounted?(≥0)`.

Cross-field rules (mirror in Zod): currency required if monthly set; monthly required if discounted set; discounted ≤ monthly.

`attribute_schema` shape: object keyed by attribute key → `{type?, required?:bool, searchable?:bool, enum?:[scalars]}`. `type ∈ {string,integer,number,boolean,date,datetime,array_string,array_integer,array_number,array_boolean}`; `enum` non-empty list of scalars.

Role→permission (gating): MODERATOR = read+create+edit, **no delete**. ADMIN = +delete. SUPERADMIN = all. Mock seed roles: `admin@example.com`=SUPERADMIN, `ops@example.com`=ADMIN, `mod@example.com`=MODERATOR.

---

## File structure

**Create:**
- `src/lib/categories/types.ts` — DTOs, payloads, cursor page, sort enum, supported-type constant.
- `src/lib/categories/api.ts` — client (`listCategories`, `getCategory`, `createCategory`, `updateCategory`, `deleteCategory`).
- `src/mocks/categories-fixtures.ts` — seed categories.
- `src/mocks/categories-store.ts` — in-memory store (Map<number,…>, cursor, search, sort, CRUD).
- `src/app/(routes)/categories/action-types.ts` — `ActionState`, `EMPTY_STATE`.
- `src/app/(routes)/categories/actions.ts` — `createCategoryAction`, `updateCategoryAction`, `deleteCategoryAction`.
- `src/app/(routes)/categories/page.tsx` — list (server).
- `src/app/(routes)/categories/_components/CategoriesTable.tsx` — table + empty-state.
- `src/app/(routes)/categories/_components/CategoryForm.tsx` — create/edit form (client, `useActionState`).
- `src/app/(routes)/categories/_components/TranslationsEditor.tsx` — locale rows → hidden JSON input.
- `src/app/(routes)/categories/_components/AttributeSchemaEditor.tsx` — raw-JSON textarea + parse feedback.
- `src/app/(routes)/categories/_components/DeleteCategoryButton.tsx` — confirm + delete action (client).
- `src/app/(routes)/categories/new/page.tsx` — create page (server; fetches parent options).
- `src/app/(routes)/categories/[id]/page.tsx` — detail/edit page (server).
- `tests/categories-list.spec.ts`, `tests/categories-crud.spec.ts`, `tests/categories-guards.spec.ts`.

**Modify:**
- `src/mocks/handlers.ts` — add 5 category handlers to the `handlers` array (import `categories-store`).
- `src/app/(routes)/layout.tsx` — add `{ href: "/categories", label: "Categories" }` to `navItems`.

---

## Task 1: Category types

**Files:**
- Create: `src/lib/categories/types.ts`

- [ ] **Step 1: Write the types**

```ts
// src/lib/categories/types.ts

export const CATEGORY_SORTS = [
  "sort_order_asc",
  "sort_order_desc",
  "name_asc",
  "name_desc",
] as const;
export type CategorySort = (typeof CATEGORY_SORTS)[number];

// Supported attribute descriptor types (backend validate_category_attributes_schema).
export const ATTRIBUTE_TYPES = [
  "string",
  "integer",
  "number",
  "boolean",
  "date",
  "datetime",
  "array_string",
  "array_integer",
  "array_number",
  "array_boolean",
] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

export type AttributeDescriptor = {
  type?: AttributeType;
  required?: boolean;
  searchable?: boolean;
  enum?: Array<string | number | boolean>;
};
export type AttributeSchema = Record<string, AttributeDescriptor>;

export type CategoryRead = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  parent_id: number | null;
  is_leaf: boolean;
  attribute_schema: AttributeSchema | null;
  publication_currency: string | null;
  publication_price_monthly: string | null;
  publication_price_monthly_discounted: string | null;
};

export type CategoryCursorPage = {
  items: CategoryRead[];
  next_last_id: number | null;
  has_more: boolean;
  count: number;
};

export type CategoryListQuery = {
  search?: string;
  sort?: CategorySort;
  last_id?: number;
  limit?: number;
};

// Mutation payload: prices serialized as strings (backend Decimal accepts strings,
// avoids float rounding). Omitted keys = unchanged on PUT.
export type CategoryMutationPayload = {
  name?: string;
  slug?: string;
  icon?: string | null;
  description?: string | null;
  name_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  sort_order?: number;
  parent_id?: number | null;
  attribute_schema?: AttributeSchema | null;
  publication_currency?: string | null;
  publication_price_monthly?: string | null;
  publication_price_monthly_discounted?: string | null;
};

export function isCategorySort(value: string): value is CategorySort {
  return (CATEGORY_SORTS as readonly string[]).includes(value);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit` (or rely on `npm run build` later).
Expected: no errors in this file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/categories/types.ts
git commit -m "feat(categories): DTO + payload types"
```

---

## Task 2: Category API client

**Files:**
- Create: `src/lib/categories/api.ts`
- Reference: `src/lib/admins/api.ts`, `src/lib/providers/api.ts`, `src/lib/api.ts` (`apiFetch`, `ApiFetchResult`)

- [ ] **Step 1: Write the client**

```ts
// src/lib/categories/api.ts
import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  CategoryCursorPage,
  CategoryListQuery,
  CategoryMutationPayload,
  CategoryRead,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace/categories";

// List is a POST with a body filter (NOT a GET query, unlike providers).
export function listCategories(
  query: CategoryListQuery = {},
): Promise<ApiFetchResult<CategoryCursorPage>> {
  const body: Record<string, unknown> = { limit: query.limit ?? 50 };
  if (query.search) body.search = query.search;
  if (query.sort) body.sort = query.sort;
  if (query.last_id !== undefined) body.last_id = query.last_id;
  return apiFetch<CategoryCursorPage>(`${BASE}/list`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getCategory(id: number): Promise<ApiFetchResult<CategoryRead>> {
  return apiFetch<CategoryRead>(`${BASE}/${id}`);
}

export function createCategory(
  payload: CategoryMutationPayload,
): Promise<ApiFetchResult<CategoryRead>> {
  return apiFetch<CategoryRead>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function updateCategory(
  id: number,
  payload: CategoryMutationPayload,
): Promise<ApiFetchResult<CategoryRead>> {
  return apiFetch<CategoryRead>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function deleteCategory(
  id: number,
): Promise<ApiFetchResult<{ success?: boolean; message?: string } | null>> {
  return apiFetch<{ success?: boolean; message?: string } | null>(
    `${BASE}/${id}`,
    { method: "DELETE", redirectOn401: false },
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/categories/api.ts
git commit -m "feat(categories): API client (list/get/create/update/delete)"
```

---

## Task 3: Mock fixtures + store

**Files:**
- Create: `src/mocks/categories-fixtures.ts`, `src/mocks/categories-store.ts`
- Reference: `src/mocks/providers-store.ts` (Map + ensureSeed + CRUD idiom)

- [ ] **Step 1: Fixtures**

```ts
// src/mocks/categories-fixtures.ts
import type { CategoryRead } from "@/lib/categories/types";

export function buildFixtureCategories(): CategoryRead[] {
  return [
    {
      id: 1,
      name: "Catering",
      slug: "catering",
      icon: "utensils",
      description: "Food & beverage providers",
      sort_order: 10,
      parent_id: null,
      is_leaf: false,
      attribute_schema: {
        cuisine: { type: "string", searchable: true },
        seats: { type: "integer", required: false },
      },
      publication_currency: "USD",
      publication_price_monthly: "49.00",
      publication_price_monthly_discounted: "39.00",
    },
    {
      id: 2,
      name: "Buffet Catering",
      slug: "buffet-catering",
      icon: null,
      description: "Self-serve buffet",
      sort_order: 20,
      parent_id: 1,
      is_leaf: true,
      attribute_schema: null,
      publication_currency: null,
      publication_price_monthly: null,
      publication_price_monthly_discounted: null,
    },
    {
      id: 3,
      name: "Venues",
      slug: "venues",
      icon: "building",
      description: "Event spaces",
      sort_order: 30,
      parent_id: null,
      is_leaf: true,
      attribute_schema: null,
      publication_currency: null,
      publication_price_monthly: null,
      publication_price_monthly_discounted: null,
    },
  ];
}
```

> Note: `CategoryRead` has no `name_translations` field — drop the stray line; fixtures only need Read fields. (Translations live on the mutation payload; the store keeps them in a side map — see Step 2.)

- [ ] **Step 2: Store** (corrected — no stray translations field on Read)

```ts
// src/mocks/categories-store.ts
import type {
  CategoryCursorPage,
  CategoryRead,
} from "@/lib/categories/types";
import { buildFixtureCategories } from "./categories-fixtures";

const categories = new Map<number, CategoryRead>();
// Translations are write-only on the mock (Read DTO omits them); persist so
// edit round-trips can assert they were stored.
const translations = new Map<
  number,
  {
    name_translations?: Record<string, string>;
    description_translations?: Record<string, string>;
  }
>();
let nextId = 100;

function ensureSeed(): void {
  if (categories.size > 0) return;
  for (const c of buildFixtureCategories()) categories.set(c.id, c);
}

export function resetCategoriesStore(): void {
  categories.clear();
  translations.clear();
  nextId = 100;
  ensureSeed();
}

export function getCategoryById(id: number): CategoryRead | null {
  ensureSeed();
  return categories.get(id) ?? null;
}

export function getCategoryTranslations(id: number) {
  ensureSeed();
  return translations.get(id) ?? {};
}

export function listCategoriesPage(opts: {
  search?: string;
  sort?: string;
  last_id?: number;
  limit?: number;
}): CategoryCursorPage {
  ensureSeed();
  let rows = Array.from(categories.values());
  if (opts.search) {
    const q = opts.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q),
    );
  }
  switch (opts.sort) {
    case "name_asc":
      rows.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name_desc":
      rows.sort((a, b) => b.name.localeCompare(a.name));
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

type CategoryWrite = Partial<Omit<CategoryRead, "id" | "is_leaf">> & {
  name_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
};

export function createCategoryRecord(input: CategoryWrite): CategoryRead {
  ensureSeed();
  const id = nextId++;
  const record: CategoryRead = {
    id,
    name: input.name ?? "",
    slug: input.slug ?? "",
    icon: input.icon ?? null,
    description: input.description ?? null,
    sort_order: input.sort_order ?? 100,
    parent_id: input.parent_id ?? null,
    is_leaf: true,
    attribute_schema: input.attribute_schema ?? null,
    publication_currency: input.publication_currency ?? null,
    publication_price_monthly: input.publication_price_monthly ?? null,
    publication_price_monthly_discounted:
      input.publication_price_monthly_discounted ?? null,
  };
  categories.set(id, record);
  translations.set(id, {
    name_translations: input.name_translations,
    description_translations: input.description_translations,
  });
  // Parent is no longer a leaf.
  if (record.parent_id != null) {
    const parent = categories.get(record.parent_id);
    if (parent) categories.set(parent.id, { ...parent, is_leaf: false });
  }
  return record;
}

export function updateCategoryRecord(
  id: number,
  patch: CategoryWrite,
): CategoryRead | null {
  ensureSeed();
  const current = categories.get(id);
  if (!current) return null;
  const updated: CategoryRead = {
    ...current,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
    ...(patch.icon !== undefined ? { icon: patch.icon } : {}),
    ...(patch.description !== undefined
      ? { description: patch.description }
      : {}),
    ...(patch.sort_order !== undefined
      ? { sort_order: patch.sort_order }
      : {}),
    ...(patch.parent_id !== undefined ? { parent_id: patch.parent_id } : {}),
    ...(patch.attribute_schema !== undefined
      ? { attribute_schema: patch.attribute_schema }
      : {}),
    ...(patch.publication_currency !== undefined
      ? { publication_currency: patch.publication_currency }
      : {}),
    ...(patch.publication_price_monthly !== undefined
      ? { publication_price_monthly: patch.publication_price_monthly }
      : {}),
    ...(patch.publication_price_monthly_discounted !== undefined
      ? {
          publication_price_monthly_discounted:
            patch.publication_price_monthly_discounted,
        }
      : {}),
  };
  categories.set(id, updated);
  const prevTr = translations.get(id) ?? {};
  translations.set(id, {
    name_translations:
      patch.name_translations ?? prevTr.name_translations,
    description_translations:
      patch.description_translations ?? prevTr.description_translations,
  });
  return updated;
}

export function deleteCategoryRecord(id: number): boolean {
  ensureSeed();
  return categories.delete(id);
}

export function hasChildren(id: number): boolean {
  ensureSeed();
  return Array.from(categories.values()).some((c) => c.parent_id === id);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/mocks/categories-fixtures.ts src/mocks/categories-store.ts
git commit -m "test(categories): MSW in-memory store + fixtures"
```

---

## Task 4: MSW handlers

**Files:**
- Modify: `src/mocks/handlers.ts`
- Reference: existing admins/providers handlers in the same file; `operatorSub`/role helper; `buildApiUrl`.

- [ ] **Step 1: Determine the role of the bearer (for delete gating)**

The mock access token embeds the operator role directly as a `role` claim (see `src/lib/auth/mock.ts` `issueMockTokens` — `new SignJWT({ email, role })`). Read it straight from the bearer; do NOT build a sub→role map. Add a local helper at the top of the categories handler block (mirror the existing `operatorSub` JWT-decode idiom in `handlers.ts`):

```ts
import { decodeJwt } from "jose";

function operatorRole(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const role = decodeJwt(auth.slice(7)).role;
    return typeof role === "string" ? role : null;
  } catch {
    return null;
  }
}
```

> If `handlers.ts` already imports `decodeJwt` (it does, for `operatorSub`), reuse the import rather than re-importing.

- [ ] **Step 2: Add the 5 handlers** (place literal `/list` before `/:id`)

```ts
import {
  createCategoryRecord,
  deleteCategoryRecord,
  getCategoryById,
  hasChildren,
  listCategoriesPage,
  updateCategoryRecord,
} from "./categories-store";

const CATEGORIES_BASE = buildApiUrl("/eventup-admin/v1/marketplace/categories");

// inside the `handlers` array:
http.post(`${CATEGORIES_BASE}/list`, async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as {
    search?: string;
    sort?: string;
    last_id?: number;
    limit?: number;
  };
  return HttpResponse.json(listCategoriesPage(body));
}),

http.post(CATEGORIES_BASE, async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const created = createCategoryRecord(body as never);
  return HttpResponse.json(created, { status: 201 });
}),

http.get(`${CATEGORIES_BASE}/:id`, ({ params }) => {
  const found = getCategoryById(Number(params.id));
  if (!found) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
  return HttpResponse.json(found);
}),

http.put(`${CATEGORIES_BASE}/:id`, async ({ params, request }) => {
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const updated = updateCategoryRecord(Number(params.id), body as never);
  if (!updated)
    return HttpResponse.json({ detail: "Not found" }, { status: 404 });
  return HttpResponse.json(updated);
}),

http.delete(`${CATEGORIES_BASE}/:id`, ({ params, request }) => {
  const role = operatorRole(request);
  if (role !== "ADMIN" && role !== "SUPERADMIN") {
    return HttpResponse.json(
      { error: { message: "forbidden", meta: { original_detail: "Requires ADMIN role" } } },
      { status: 403 },
    );
  }
  const id = Number(params.id);
  if (hasChildren(id)) {
    return HttpResponse.json(
      {
        error: {
          message: "conflict",
          meta: { original_detail: "Category has child categories" },
        },
      },
      { status: 409 },
    );
  }
  const ok = deleteCategoryRecord(id);
  if (!ok) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
  return new HttpResponse(null, { status: 204 });
}),
```

- [ ] **Step 3: Reset hook.** Find where other stores are reset between tests (a `resetAllStores`/`resetHandlers` setup). Add `resetCategoriesStore()` alongside the existing `reset*Store()` calls so e2e runs are isolated.

- [ ] **Step 4: Commit**

```bash
git add src/mocks/handlers.ts
git commit -m "test(categories): MSW handlers for categories CRUD"
```

---

## Task 5: Server actions + ActionState

**Files:**
- Create: `src/app/(routes)/categories/action-types.ts`, `src/app/(routes)/categories/actions.ts`
- Reference: `src/app/(routes)/admins/action-types.ts`, `src/app/(routes)/admins/[id]/actions.ts`

- [ ] **Step 1: ActionState**

```ts
// src/app/(routes)/categories/action-types.ts
export type ActionState =
  | { ok: true; error: null }
  | { ok: false; error: string };
export const EMPTY_STATE: ActionState = { ok: true, error: null };
```

- [ ] **Step 2: Zod schema + actions** (the `attribute_schema`, translations, and pricing validation is the core risk — full code below)

```ts
// src/app/(routes)/categories/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/categories/api";
import { ATTRIBUTE_TYPES } from "@/lib/categories/types";
import type {
  AttributeSchema,
  CategoryMutationPayload,
} from "@/lib/categories/types";
import type { ActionState } from "./action-types";

function fail(message: string): ActionState {
  return { ok: false, error: message };
}

const descriptorSchema = z.object({
  type: z.enum(ATTRIBUTE_TYPES).optional(),
  required: z.boolean().optional(),
  searchable: z.boolean().optional(),
  enum: z
    .array(z.union([z.string(), z.number(), z.boolean()]))
    .min(1, "enum must be a non-empty list")
    .optional(),
});
const attributeSchemaSchema = z.record(z.string(), descriptorSchema);
const translationsSchema = z.record(z.string(), z.string());

// Parse a hidden JSON field; "" / missing → undefined. Throws a friendly
// message on malformed JSON.
function parseJsonField(formData: FormData, key: string): unknown {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${key}: invalid JSON`);
  }
}

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

// Build the mutation payload from FormData. `requireCore` = true for create
// (name/slug mandatory); false for edit (partial).
function buildPayload(
  formData: FormData,
  requireCore: boolean,
): { ok: true; payload: CategoryMutationPayload } | { ok: false; error: string } {
  const payload: CategoryMutationPayload = {};

  const name = str(formData, "name");
  const slug = str(formData, "slug");
  if (requireCore && (!name || !slug)) {
    return { ok: false, error: "Name and slug are required" };
  }
  if (name !== undefined) payload.name = name;
  if (slug !== undefined) payload.slug = slug;

  const icon = str(formData, "icon");
  if (icon !== undefined) payload.icon = icon;
  const description = str(formData, "description");
  if (description !== undefined) payload.description = description;

  const sortRaw = str(formData, "sort_order");
  if (sortRaw !== undefined) {
    const n = Number(sortRaw);
    if (!Number.isInteger(n) || n < 0 || n > 10000)
      return { ok: false, error: "Sort order must be an integer 0–10000" };
    payload.sort_order = n;
  }

  const parentRaw = str(formData, "parent_id");
  if (parentRaw !== undefined) {
    const n = Number(parentRaw);
    if (!Number.isInteger(n) || n < 1)
      return { ok: false, error: "Invalid parent category" };
    payload.parent_id = n;
  }

  // Prices (sent as strings).
  const currency = str(formData, "publication_currency");
  const monthly = str(formData, "publication_price_monthly");
  const discounted = str(formData, "publication_price_monthly_discounted");
  if (monthly !== undefined) {
    const m = Number(monthly);
    if (!Number.isFinite(m) || m < 0)
      return { ok: false, error: "Monthly price must be ≥ 0" };
    if (currency === undefined)
      return { ok: false, error: "Currency is required when a monthly price is set" };
    payload.publication_price_monthly = monthly;
  }
  if (currency !== undefined) payload.publication_currency = currency;
  if (discounted !== undefined) {
    const d = Number(discounted);
    if (!Number.isFinite(d) || d < 0)
      return { ok: false, error: "Discounted price must be ≥ 0" };
    if (payload.publication_price_monthly === undefined)
      return { ok: false, error: "Monthly price is required when a discounted price is set" };
    if (d > Number(payload.publication_price_monthly))
      return { ok: false, error: "Discounted price cannot exceed the monthly price" };
    payload.publication_price_monthly_discounted = discounted;
  }

  // JSON fields.
  try {
    const nameTr = parseJsonField(formData, "name_translations");
    if (nameTr !== undefined) {
      const p = translationsSchema.safeParse(nameTr);
      if (!p.success) return { ok: false, error: "Invalid name translations" };
      if (Object.keys(p.data).length > 0) payload.name_translations = p.data;
    }
    const descTr = parseJsonField(formData, "description_translations");
    if (descTr !== undefined) {
      const p = translationsSchema.safeParse(descTr);
      if (!p.success)
        return { ok: false, error: "Invalid description translations" };
      if (Object.keys(p.data).length > 0)
        payload.description_translations = p.data;
    }
    const attr = parseJsonField(formData, "attribute_schema");
    if (attr !== undefined) {
      const p = attributeSchemaSchema.safeParse(attr);
      if (!p.success)
        return {
          ok: false,
          error: p.error.issues[0]?.message ?? "Invalid attribute schema",
        };
      payload.attribute_schema = p.data as AttributeSchema;
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }

  return { ok: true, payload };
}

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const built = buildPayload(formData, true);
  if (!built.ok) return fail(built.error);
  const result = await createCategory(built.payload);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath("/categories");
  redirect(`/categories/${result.data.id}`);
}

export async function updateCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const idRaw = formData.get("id");
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id < 1) return fail("Invalid category id");
  const built = buildPayload(formData, false);
  if (!built.ok) return fail(built.error);
  if (Object.keys(built.payload).length === 0) return fail("Nothing to update");
  const result = await updateCategory(id, built.payload);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath(`/categories/${id}`);
  revalidatePath("/categories");
  return { ok: true, error: null };
}

export async function deleteCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) return fail("Invalid category id");
  const result = await deleteCategory(id);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath("/categories");
  redirect("/categories");
}
```

> Note on `redirect()` in actions: `next/navigation` `redirect` throws a control-flow signal — do not wrap the `redirect(...)` call in try/catch. The function ends there (no return needed after it).

- [ ] **Step 3: Commit**

```bash
git add src/app/\(routes\)/categories/action-types.ts src/app/\(routes\)/categories/actions.ts
git commit -m "feat(categories): server actions with Zod validation"
```

---

## Task 6: Sub-form components (translations, attribute schema)

**Files:**
- Create: `src/app/(routes)/categories/_components/TranslationsEditor.tsx`, `.../AttributeSchemaEditor.tsx`

- [ ] **Step 1: TranslationsEditor** — locale rows → hidden JSON input

```tsx
// src/app/(routes)/categories/_components/TranslationsEditor.tsx
"use client";
import { useState } from "react";

type Row = { locale: string; value: string };

function toRows(dict: Record<string, string> | undefined): Row[] {
  if (!dict) return [];
  return Object.entries(dict).map(([locale, value]) => ({ locale, value }));
}
function toDict(rows: Row[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of rows) {
    const loc = r.locale.trim();
    if (loc) out[loc] = r.value;
  }
  return out;
}

export function TranslationsEditor({
  name, // hidden input name, e.g. "name_translations"
  label,
  initial,
}: {
  name: string;
  label: string;
  initial?: Record<string, string>;
}) {
  const [rows, setRows] = useState<Row[]>(toRows(initial));
  return (
    <fieldset className="space-y-2" data-testid={`tr-${name}`}>
      <legend className="text-sm font-medium">{label}</legend>
      <input type="hidden" name={name} value={JSON.stringify(toDict(rows))} />
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input
            aria-label={`${name} locale ${i}`}
            data-testid={`${name}-locale-${i}`}
            className="w-24 rounded border px-2 py-1 text-sm"
            placeholder="en"
            value={row.locale}
            onChange={(e) =>
              setRows((rs) =>
                rs.map((r, j) =>
                  j === i ? { ...r, locale: e.target.value } : r,
                ),
              )
            }
          />
          <input
            aria-label={`${name} value ${i}`}
            data-testid={`${name}-value-${i}`}
            className="flex-1 rounded border px-2 py-1 text-sm"
            value={row.value}
            onChange={(e) =>
              setRows((rs) =>
                rs.map((r, j) =>
                  j === i ? { ...r, value: e.target.value } : r,
                ),
              )
            }
          />
          <button
            type="button"
            className="text-sm text-red-700"
            onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        data-testid={`${name}-add`}
        className="text-sm text-blue-700"
        onClick={() => setRows((rs) => [...rs, { locale: "", value: "" }])}
      >
        + Add locale
      </button>
    </fieldset>
  );
}
```

- [ ] **Step 2: AttributeSchemaEditor** — raw JSON textarea + live parse feedback (validation authoritative in action/backend)

```tsx
// src/app/(routes)/categories/_components/AttributeSchemaEditor.tsx
"use client";
import { useState } from "react";

export function AttributeSchemaEditor({
  initial,
}: {
  initial?: Record<string, unknown> | null;
}) {
  const [text, setText] = useState(
    initial ? JSON.stringify(initial, null, 2) : "",
  );
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium" htmlFor="attribute_schema">
        Attribute schema (JSON)
      </label>
      <textarea
        id="attribute_schema"
        name="attribute_schema"
        data-testid="attribute-schema-input"
        rows={8}
        className="w-full rounded border px-2 py-1 font-mono text-xs"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text.trim() === "") return setErr(null);
          try {
            JSON.parse(text);
            setErr(null);
          } catch {
            setErr("Invalid JSON");
          }
        }}
        placeholder='{ "cuisine": { "type": "string", "searchable": true } }'
      />
      {err ? (
        <p data-testid="attribute-schema-error" className="text-sm text-red-700">
          {err}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(routes\)/categories/_components/TranslationsEditor.tsx src/app/\(routes\)/categories/_components/AttributeSchemaEditor.tsx
git commit -m "feat(categories): translations + attribute-schema sub-editors"
```

---

## Task 7: CategoryForm (create/edit)

**Files:**
- Create: `src/app/(routes)/categories/_components/CategoryForm.tsx`
- Reference: `AdminManagePanel.tsx` (`useActionState`, key-remount reset)

- [ ] **Step 1: Form component**

```tsx
// src/app/(routes)/categories/_components/CategoryForm.tsx
"use client";
import { useActionState } from "react";
import {
  createCategoryAction,
  updateCategoryAction,
} from "../actions";
import { EMPTY_STATE } from "../action-types";
import type { CategoryRead } from "@/lib/categories/types";
import { TranslationsEditor } from "./TranslationsEditor";
import { AttributeSchemaEditor } from "./AttributeSchemaEditor";

type ParentOption = { id: number; name: string };

export function CategoryForm({
  mode,
  category,
  parentOptions,
  nameTranslations,
  descriptionTranslations,
}: {
  mode: "create" | "edit";
  category?: CategoryRead;
  parentOptions: ParentOption[];
  nameTranslations?: Record<string, string>;
  descriptionTranslations?: Record<string, string>;
}) {
  const action = mode === "create" ? createCategoryAction : updateCategoryAction;
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);
  const c = category;
  return (
    <form action={formAction} data-testid="category-form" className="space-y-4">
      {mode === "edit" && c ? (
        <input type="hidden" name="id" value={c.id} />
      ) : null}

      <label className="block">
        <span className="text-sm font-medium">Name</span>
        <input
          name="name"
          data-testid="category-name"
          defaultValue={c?.name ?? ""}
          required={mode === "create"}
          className="mt-1 w-full rounded border px-2 py-1"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Slug</span>
        <input
          name="slug"
          data-testid="category-slug"
          defaultValue={c?.slug ?? ""}
          required={mode === "create"}
          className="mt-1 w-full rounded border px-2 py-1"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Icon</span>
        <input
          name="icon"
          defaultValue={c?.icon ?? ""}
          className="mt-1 w-full rounded border px-2 py-1"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Description</span>
        <textarea
          name="description"
          defaultValue={c?.description ?? ""}
          className="mt-1 w-full rounded border px-2 py-1"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Sort order</span>
        <input
          name="sort_order"
          type="number"
          defaultValue={c?.sort_order ?? 100}
          className="mt-1 w-32 rounded border px-2 py-1"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Parent</span>
        <select
          name="parent_id"
          data-testid="category-parent"
          defaultValue={c?.parent_id != null ? String(c.parent_id) : ""}
          className="mt-1 w-full rounded border px-2 py-1"
        >
          <option value="">— none —</option>
          {parentOptions
            .filter((p) => p.id !== c?.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </label>

      <fieldset className="grid grid-cols-3 gap-2">
        <legend className="text-sm font-medium">Publication pricing</legend>
        <input
          name="publication_currency"
          placeholder="USD"
          defaultValue={c?.publication_currency ?? ""}
          className="rounded border px-2 py-1"
        />
        <input
          name="publication_price_monthly"
          placeholder="Monthly"
          defaultValue={c?.publication_price_monthly ?? ""}
          className="rounded border px-2 py-1"
        />
        <input
          name="publication_price_monthly_discounted"
          placeholder="Discounted"
          defaultValue={c?.publication_price_monthly_discounted ?? ""}
          className="rounded border px-2 py-1"
        />
      </fieldset>

      <TranslationsEditor
        name="name_translations"
        label="Name translations"
        initial={nameTranslations}
      />
      <TranslationsEditor
        name="description_translations"
        label="Description translations"
        initial={descriptionTranslations}
      />
      <AttributeSchemaEditor initial={c?.attribute_schema ?? null} />

      <button
        type="submit"
        disabled={pending}
        data-testid="category-submit"
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="category-error" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(routes\)/categories/_components/CategoryForm.tsx
git commit -m "feat(categories): create/edit form (useActionState)"
```

---

## Task 8: List page + table + nav

**Files:**
- Create: `src/app/(routes)/categories/page.tsx`, `.../_components/CategoriesTable.tsx`
- Modify: `src/app/(routes)/layout.tsx`
- Reference: `admins/page.tsx`, `admins/_components/AdminsTable.tsx`

- [ ] **Step 1: Table**

```tsx
// src/app/(routes)/categories/_components/CategoriesTable.tsx
import Link from "next/link";
import type { CategoryRead } from "@/lib/categories/types";

export function CategoriesTable({
  rows,
  parentNames,
}: {
  rows: CategoryRead[];
  parentNames: Map<number, string>;
}) {
  if (rows.length === 0)
    return (
      <p data-testid="categories-empty" className="p-4 text-gray-500">
        No categories yet.
      </p>
    );
  return (
    <table className="w-full text-sm" data-testid="categories-table">
      <thead>
        <tr className="text-left text-gray-500">
          <th className="py-2">Name</th>
          <th>Slug</th>
          <th>Parent</th>
          <th>Sort</th>
          <th>Leaf</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t" data-testid={`category-row-${r.id}`}>
            <td className="py-2">{r.name}</td>
            <td>{r.slug}</td>
            <td>{r.parent_id != null ? (parentNames.get(r.parent_id) ?? r.parent_id) : "—"}</td>
            <td>{r.sort_order}</td>
            <td>{r.is_leaf ? "yes" : "no"}</td>
            <td>
              <Link
                href={`/categories/${r.id}`}
                data-testid={`category-edit-${r.id}`}
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

- [ ] **Step 2: List page** (search + sort via URL search params; "New" button always visible — all roles can create)

```tsx
// src/app/(routes)/categories/page.tsx
import Link from "next/link";
import { listCategories } from "@/lib/categories/api";
import { isCategorySort } from "@/lib/categories/types";
import { CategoriesTable } from "./_components/CategoriesTable";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const sort = sp.sort && isCategorySort(sp.sort) ? sp.sort : "sort_order_asc";
  const result = await listCategories({ search: sp.search, sort, limit: 100 });

  if (!result.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <div
          data-testid="categories-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {result.status === 403
            ? "Viewing categories requires an admin role."
            : `Failed to load categories: ${result.message}`}
        </div>
      </div>
    );
  }

  const rows = result.data.items;
  const parentNames = new Map(rows.map((r) => [r.id, r.name]));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <Link
          href="/categories/new"
          data-testid="category-new"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          New category
        </Link>
      </div>

      <form className="mt-4 flex gap-2" data-testid="categories-search">
        <input
          name="search"
          placeholder="Search name or slug"
          defaultValue={sp.search ?? ""}
          className="rounded border px-2 py-1"
        />
        <select name="sort" defaultValue={sort} className="rounded border px-2 py-1">
          <option value="sort_order_asc">Sort ↑</option>
          <option value="sort_order_desc">Sort ↓</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
        </select>
        <button type="submit" className="rounded border px-3 py-1">
          Apply
        </button>
      </form>

      <div className="mt-4">
        <CategoriesTable rows={rows} parentNames={parentNames} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Nav link** — `src/app/(routes)/layout.tsx`, add to `navItems` (no `superadminOnly`):

```tsx
{ href: "/categories", label: "Categories" },
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(routes\)/categories/page.tsx src/app/\(routes\)/categories/_components/CategoriesTable.tsx src/app/\(routes\)/layout.tsx
git commit -m "feat(categories): list page, table, nav link"
```

---

## Task 9: New + detail/edit pages + delete button

**Files:**
- Create: `src/app/(routes)/categories/new/page.tsx`, `.../[id]/page.tsx`, `.../_components/DeleteCategoryButton.tsx`

- [ ] **Step 1: parent-options helper.** Both pages need `{id,name}[]`. Inline in each page: fetch `listCategories({ limit: 100 })`, map to `{id,name}`. (Keep it inline — no shared util needed for one call.)

- [ ] **Step 2: New page**

```tsx
// src/app/(routes)/categories/new/page.tsx
import { listCategories } from "@/lib/categories/api";
import { CategoryForm } from "../_components/CategoryForm";

export default async function NewCategoryPage() {
  const res = await listCategories({ limit: 100 });
  const parentOptions = res.ok
    ? res.data.items.map((c) => ({ id: c.id, name: c.name }))
    : [];
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">New category</h1>
      <div className="mt-4 max-w-2xl">
        <CategoryForm mode="create" parentOptions={parentOptions} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: DeleteCategoryButton** (client, `useActionState`, confirm)

```tsx
// src/app/(routes)/categories/_components/DeleteCategoryButton.tsx
"use client";
import { useActionState } from "react";
import { deleteCategoryAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

export function DeleteCategoryButton({ id }: { id: number }) {
  const [state, formAction, pending] = useActionState(
    deleteCategoryAction,
    EMPTY_STATE,
  );
  return (
    <form
      action={formAction}
      data-testid="category-delete-form"
      onSubmit={(e) => {
        if (!confirm("Delete this category? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        data-testid="category-delete"
        className="rounded border border-red-300 px-4 py-2 text-red-700"
      >
        {pending ? "Deleting…" : "Delete category"}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="category-delete-error" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
```

- [ ] **Step 4: Detail/edit page** (role-gate delete: hide for MODERATOR; key-remount form on server-authoritative values)

```tsx
// src/app/(routes)/categories/[id]/page.tsx
import { notFound } from "next/navigation";
import { getCategory, listCategories } from "@/lib/categories/api";
import { getAdminSession } from "@/lib/auth/session";
import { CategoryForm } from "../_components/CategoryForm";
import { DeleteCategoryButton } from "../_components/DeleteCategoryButton";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  const [catRes, listRes, session] = await Promise.all([
    getCategory(numId),
    listCategories({ limit: 100 }),
    getAdminSession(),
  ]);

  if (catRes.status === 404) notFound();
  if (!catRes.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Category</h1>
        <div
          data-testid="category-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {`Failed to load category: ${catRes.message}`}
        </div>
      </div>
    );
  }

  const category = catRes.data;
  const parentOptions = listRes.ok
    ? listRes.data.items.map((c) => ({ id: c.id, name: c.name }))
    : [];
  // Delete requires ADMIN_MARKETPLACE_PROVIDERS_RISK → ADMIN or SUPERADMIN.
  const canDelete = session?.role === "ADMIN" || session?.role === "SUPERADMIN";

  // Key-remount so revalidated server values reset the uncontrolled form
  // (React 19 <form action> reset gotcha — see PR #18).
  const formKey = `${category.id}:${category.name}:${category.slug}:${category.sort_order}`;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold" data-testid="category-detail-name">
        {category.name}
      </h1>
      <div className="mt-4 max-w-2xl space-y-6">
        <CategoryForm
          key={formKey}
          mode="edit"
          category={category}
          parentOptions={parentOptions}
        />
        {canDelete ? <DeleteCategoryButton id={category.id} /> : null}
      </div>
    </div>
  );
}
```

> Note: translations are not returned by the Read DTO (backend omits them from `MarketplaceCategoryRead`). The edit form therefore opens with empty translation rows; saving re-sends whatever the operator enters. This matches the backend contract — do not invent a translations GET. (If a future PR adds a translations read endpoint, wire `nameTranslations`/`descriptionTranslations` props then.)

- [ ] **Step 5: Commit**

```bash
git add src/app/\(routes\)/categories/new src/app/\(routes\)/categories/\[id\] src/app/\(routes\)/categories/_components/DeleteCategoryButton.tsx
git commit -m "feat(categories): new + detail/edit pages, role-gated delete"
```

---

## Task 10: e2e — list

**Files:**
- Create: `tests/categories-list.spec.ts`
- Reference: `tests/admin-detail.spec.ts`, `tests/helpers/login.ts`

- [ ] **Step 1: Write the spec**

```ts
// tests/categories-list.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Categories list", () => {
  test("renders seeded categories", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories");
    await expect(page.getByTestId("categories-table")).toBeVisible();
    await expect(page.getByText("Catering")).toBeVisible();
    await expect(page.getByText("Venues")).toBeVisible();
  });

  test("search filters rows", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories");
    await page.getByPlaceholder("Search name or slug").fill("venue");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("Venues")).toBeVisible();
    await expect(page.getByText("Catering")).toHaveCount(0);
  });

  test("nav link is present", async ({ page }) => {
    await loginAsMockAdmin(page, "/services");
    await expect(page.getByRole("link", { name: "Categories" })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run**

Run: `npm run test:e2e -- categories-list`
Expected: PASS (after Tasks 1–8). If FAIL, fix the implicated file, re-run.

- [ ] **Step 3: Commit**

```bash
git add tests/categories-list.spec.ts
git commit -m "test(categories): e2e list/search/nav"
```

---

## Task 11: e2e — CRUD

**Files:**
- Create: `tests/categories-crud.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
// tests/categories-crud.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Categories CRUD", () => {
  test("create a category and land on its detail", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/new");
    await page.getByTestId("category-name").fill("Photography");
    await page.getByTestId("category-slug").fill("photography");
    await page.getByTestId("category-submit").click();
    await expect(page.getByTestId("category-detail-name")).toHaveText(
      "Photography",
    );
  });

  test("create with translations + attribute schema", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/new");
    await page.getByTestId("category-name").fill("DJ Services");
    await page.getByTestId("category-slug").fill("dj-services");
    await page.getByTestId("name_translations-add").click();
    await page.getByTestId("name_translations-locale-0").fill("ar");
    await page.getByTestId("name_translations-value-0").fill("دي جي");
    await page
      .getByTestId("attribute-schema-input")
      .fill('{"genre":{"type":"string","searchable":true}}');
    await page.getByTestId("category-submit").click();
    await expect(page.getByTestId("category-detail-name")).toHaveText(
      "DJ Services",
    );
  });

  test("invalid attribute schema JSON surfaces an error", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/new");
    await page.getByTestId("category-name").fill("Bad Schema");
    await page.getByTestId("category-slug").fill("bad-schema");
    await page.getByTestId("attribute-schema-input").fill("{not valid json");
    await page.getByTestId("category-submit").click();
    await expect(page.getByTestId("category-error")).toContainText(
      "invalid JSON",
    );
  });

  test("discounted price above monthly is rejected", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/new");
    await page.getByTestId("category-name").fill("Pricey");
    await page.getByTestId("category-slug").fill("pricey");
    await page.getByPlaceholder("USD").fill("USD");
    await page.getByPlaceholder("Monthly").fill("10");
    await page.getByPlaceholder("Discounted").fill("20");
    await page.getByTestId("category-submit").click();
    await expect(page.getByTestId("category-error")).toContainText(
      "cannot exceed",
    );
  });

  test("edit updates a field", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/3"); // Venues
    await page.getByTestId("category-name").fill("Event Venues");
    await page.getByTestId("category-submit").click();
    await expect(page.getByTestId("category-detail-name")).toHaveText(
      "Event Venues",
    );
  });
});
```

- [ ] **Step 2: Run + fix**

Run: `npm run test:e2e -- categories-crud`
Expected: PASS. Watch for the create→redirect→detail flow and the key-remount edit reset.

- [ ] **Step 3: Commit**

```bash
git add tests/categories-crud.spec.ts
git commit -m "test(categories): e2e create/edit/validation"
```

---

## Task 12: e2e — role guards

**Files:**
- Create: `tests/categories-guards.spec.ts`

- [ ] **Step 1: Write the spec** (MODERATOR cannot delete; ADMIN/SUPERADMIN can)

```ts
// tests/categories-guards.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Categories role gating", () => {
  test("MODERATOR sees no delete button", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/3", { email: "mod@example.com" });
    await expect(page.getByTestId("category-form")).toBeVisible();
    await expect(page.getByTestId("category-delete")).toHaveCount(0);
  });

  test("ADMIN can delete a leaf category", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/3", { email: "ops@example.com" });
    await expect(page.getByTestId("category-delete")).toBeVisible();
    page.on("dialog", (d) => d.accept());
    await page.getByTestId("category-delete").click();
    await page.waitForURL("**/categories**");
    await expect(page.getByText("Venues")).toHaveCount(0);
  });

  test("deleting a parent with children is rejected", async ({ page }) => {
    await loginAsMockAdmin(page, "/categories/1", { email: "admin@example.com" }); // Catering has child id 2
    page.on("dialog", (d) => d.accept());
    await page.getByTestId("category-delete").click();
    await expect(page.getByTestId("category-delete-error")).toContainText(
      "child categories",
    );
  });
});
```

- [ ] **Step 0 (prerequisite for the ADMIN test): add `ops@example.com` as a mock login identity.** `src/lib/auth/mock.ts` `MOCK_USERS` currently has only `admin@example.com` (SUPERADMIN) and `mod@example.com` (MODERATOR); `isValidMockCredentials` gates login on membership in that map, so `ops@example.com` cannot log in until added. Add this entry (sub mirrors the `ADMIN_ID` seed in `admins-store.ts`):

```ts
  "ops@example.com": {
    sub: "22222222-2222-4222-8222-222222222222",
    email: "ops@example.com",
    role: "ADMIN",
  },
```

Its `role: "ADMIN"` claim flows into the JWT, so `operatorRole` (handler) and `getAdminSession().role` (page) both resolve ADMIN — delete is allowed for this user, hidden for `mod@example.com`.

- [ ] **Step 2: Run + fix**

Run: `npm run test:e2e -- categories-guards`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/categories-guards.spec.ts
git commit -m "test(categories): e2e role gating for delete"
```

---

## Task 13: Full verification

- [ ] **Step 1: Lint** — Run: `npm run lint`. Expected: clean. Fix any findings.
- [ ] **Step 2: Build (type-check gate)** — Run: `NEXT_PUBLIC_USE_MOCK_AUTH=true NEXT_PUBLIC_USE_MOCK_BACKEND=true NEXT_PUBLIC_API_URL=http://127.0.0.1:65535 npm run build`. Expected: success, no TS errors.
- [ ] **Step 3: Full e2e** — Run: `npm run test:e2e`. Expected: all specs green (existing + new). Fix regressions (e.g. nav `shell-nav.spec.ts` may assert the nav item list — update it to include "Categories").
- [ ] **Step 4: Commit any fixes**, then proceed to PR.

---

## Task 14: PR

- [ ] **Step 1: Push branch + open PR targeting `main`.**

```bash
git push -u origin claude/tender-meitner-983825
gh pr create --base main --title "feat(categories): content-management UI (CRUD + translations + attribute schema)" --body "<summary + spec/plan links + test evidence>"
```

- [ ] **Step 2: Self-review the diff** (per CLAUDE.md): silent failures, missing error paths, scope creep, dead code.
- [ ] **Step 3: Verify CI green** (`gh pr checks`).
- [ ] **Step 4: STOP — `main` merge needs explicit user confirm-this-turn + live smoke** (user types password at admin-marketplace.speakup.ltd). Do not auto-merge.

---

## Self-review (plan vs spec)

- **Spec coverage:** list/search/sort (T8,T10) ✓; detail (T9) ✓; create (T9,T11) ✓; edit (T9,T11) ✓; delete + role gate (T9,T12) ✓; translations editor (T6,T11) ✓; attribute_schema JSON editor + validation (T6,T5,T11) ✓; pricing cross-field (T5,T11) ✓; nav gating (T8) ✓; API client incl. POST /list divergence (T2) ✓; mocks (T3,T4) ✓; error envelope reliance (T5 uses `result.message`) ✓; verification (T13) ✓; PR/merge gate (T14) ✓.
- **Known confirmations to honor during execution (not placeholders — explicit verify steps):** exact mock `sub`→role values + `ops@` ADMIN seed (T4 Step 1, T12); Next 16 docs path (Pre-flight); whether `shell-nav.spec.ts` enumerates nav items (T13 Step 3).
- **Type consistency:** `CategoryRead`/`CategoryMutationPayload`/`CategoryCursorPage`/`CategorySort`/`ATTRIBUTE_TYPES` used identically across client, actions, store, components. `ApiFetchResult` `{ok,data}|{ok,message}` consumed consistently. Action signature `(_prev: ActionState, formData: FormData)` uniform.
- **Translations on edit:** explicitly documented that Read DTO omits translations → edit opens empty rows (T9 Step 4 note). Not a gap; a contract fact.
