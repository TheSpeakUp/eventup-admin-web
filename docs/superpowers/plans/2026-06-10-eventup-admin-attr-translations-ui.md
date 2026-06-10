# Attribute-Definition Translations UI (F10) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an operator UI to view + replace the per-attribute-definition translation set (localized field labels/descriptions + per-enum-value labels) in `eventup-admin-web`, as a sub-route of the F9 attribute-definitions feature.

**Architecture:** A new App-Router sub-route `/attribute-definitions/[key]/translations` (server component fetches GET translations, renders a client `TranslationsEditor`). The editor holds two dynamic row-lists in React state and serializes them into two hidden JSON form fields; a single `"use server"` action Zod-validates and PUTs the full set (full-replace upsert). MSW mock backend serves GET/PUT for e2e. Reuses the F9 API client, store, and `ActionState`.

**Tech Stack:** Next.js 16 (App Router), React 19 (`useActionState`), TypeScript, Zod v4, MSW, Playwright, Tailwind v4, pnpm.

**Base:** branch `feat/eventup-admin-attr-translations` off latest `origin/main` (F9 already merged — its files are in main; do NOT recreate them). Spec: `docs/superpowers/specs/2026-06-10-eventup-admin-attribute-definition-translations-ui-design.md`.

**Verification env (build/e2e):** `NEXT_PUBLIC_USE_MOCK_AUTH=true NEXT_PUBLIC_USE_MOCK_BACKEND=true NEXT_PUBLIC_API_URL=http://127.0.0.1:65535`.

**Backend contract (verified `eventup-backend` `origin/main`, `translations_views.py` + `attribute_registry_admin_schemas.py`):**
- `GET /eventup-admin/v1/marketplace/attribute-definitions/{key}/translations` — READ (MODERATOR+), no audit.
- `PUT …/{key}/translations` — MODERATE (MODERATOR+), step-up no-op, **full-replace upsert**, no DELETE.
- Read & PUT-response shape `{ attribute_key, field_translations[], enum_value_translations[] }`.
- `field_translations[]`: `{ locale(2–10), label(1–200), description?(≤4000) }`, unique locale.
- `enum_value_translations[]`: `{ locale(2–10), enum_value(1–255), label(1–200) }`, unique (locale, enum_value).
- PUT body = `{ field_translations[], enum_value_translations[] }` (both default empty). Empty arrays clear the set.
- locale normalized server-side; unsupported → error via generic envelope.

---

## Task 1: API types + client (extend F9)

**Files:**
- Modify: `src/lib/attribute-definitions/types.ts` (append)
- Modify: `src/lib/attribute-definitions/api.ts` (append)

- [ ] **Step 1: Append translation types to `types.ts`**

```typescript
// ---- Translations sub-resource (F10) ----
export type AttributeFieldTranslation = {
  locale: string;
  label: string;
  description?: string | null;
};

export type AttributeEnumTranslation = {
  locale: string;
  enum_value: string;
  label: string;
};

export type AttributeDefinitionTranslations = {
  attribute_key: string;
  field_translations: AttributeFieldTranslation[];
  enum_value_translations: AttributeEnumTranslation[];
};

// PUT body = full replace; same row shapes, no attribute_key (it's in the URL).
export type AttributeDefinitionTranslationsPayload = {
  field_translations: AttributeFieldTranslation[];
  enum_value_translations: AttributeEnumTranslation[];
};
```

- [ ] **Step 2: Append the two client functions to `api.ts`**

```typescript
export function getAttributeDefinitionTranslations(
  key: string,
): Promise<ApiFetchResult<AttributeDefinitionTranslations>> {
  return apiFetch<AttributeDefinitionTranslations>(
    `${BASE}/${encodeURIComponent(key)}/translations`,
  );
}

export function putAttributeDefinitionTranslations(
  key: string,
  payload: AttributeDefinitionTranslationsPayload,
): Promise<ApiFetchResult<AttributeDefinitionTranslations>> {
  return apiFetch<AttributeDefinitionTranslations>(
    `${BASE}/${encodeURIComponent(key)}/translations`,
    { method: "PUT", body: JSON.stringify(payload), redirectOn401: false },
  );
}
```

Also add the new types to the existing `import type { … } from "./types";` block in `api.ts`: add `AttributeDefinitionTranslations`, `AttributeDefinitionTranslationsPayload`.

- [ ] **Step 3: Type-check + commit**

Run: `NEXT_PUBLIC_USE_MOCK_AUTH=true NEXT_PUBLIC_USE_MOCK_BACKEND=true NEXT_PUBLIC_API_URL=http://127.0.0.1:65535 npm run build` → PASS.

```bash
git add src/lib/attribute-definitions/types.ts src/lib/attribute-definitions/api.ts
git commit -m "feat(attr-translations): API types + client for translations sub-resource"
```

---

## Task 2: Mock store + handlers (extend F9)

**Files:**
- Modify: `src/mocks/attribute-definitions-store.ts` (add translations map + accessors + seed)
- Modify: `src/mocks/handlers.ts` (add GET + PUT translation routes)

- [ ] **Step 1: Extend the store** — add to `src/mocks/attribute-definitions-store.ts`:

Add to the imports at top:
```typescript
import type {
  AttributeDefinitionCursorPage,
  AttributeDefinitionRead,
  AttributeDefinitionTranslations,
  AttributeDefinitionTranslationsPayload,
} from "@/lib/attribute-definitions/types";
```

Add the translations map + seed (after the `defs` map / `nextId` declaration):
```typescript
type TranslationSet = {
  field_translations: AttributeDefinitionTranslations["field_translations"];
  enum_value_translations: AttributeDefinitionTranslations["enum_value_translations"];
};
const translations = new Map<string, TranslationSet>();

function ensureTranslationSeed(): void {
  if (translations.size > 0) return;
  // Seed one set on the `cuisine` fixture so the GET-render e2e has data.
  translations.set("cuisine", {
    field_translations: [
      { locale: "en", label: "Cuisine", description: "Type of cuisine" },
      { locale: "ru", label: "Кухня", description: null },
    ],
    enum_value_translations: [
      { locale: "ru", enum_value: "italian", label: "Итальянская" },
    ],
  });
}
```

In `ensureSeed()` add a call to `ensureTranslationSeed();` (after seeding `defs`). In `resetAttributeDefinitionsStore()` add `translations.clear();` (before the `ensureSeed()` call).

Add the accessors (after `deleteAttributeDefinitionRecord`):
```typescript
export function getAttributeDefinitionTranslations(
  key: string,
): TranslationSet {
  ensureSeed();
  ensureTranslationSeed();
  return (
    translations.get(key) ?? {
      field_translations: [],
      enum_value_translations: [],
    }
  );
}

// Returns the stored set, or null if the definition key does not exist.
export function setAttributeDefinitionTranslations(
  key: string,
  payload: AttributeDefinitionTranslationsPayload,
): TranslationSet | null {
  ensureSeed();
  if (!defs.has(key)) return null;
  const set: TranslationSet = {
    field_translations: payload.field_translations ?? [],
    enum_value_translations: payload.enum_value_translations ?? [],
  };
  translations.set(key, set);
  return set;
}
```

- [ ] **Step 2: Add the handlers** — in `src/mocks/handlers.ts`, add the store imports to the existing `./attribute-definitions-store` import block:
```typescript
  getAttributeDefinitionTranslations,
  setAttributeDefinitionTranslations,
```
Then register the two routes immediately AFTER the create `http.post(ATTRIBUTE_DEFINITIONS_BASE, …)` handler and BEFORE `http.get(\`${ATTRIBUTE_DEFINITIONS_BASE}/:key\`, …)`:

```typescript
  http.get(
    `${ATTRIBUTE_DEFINITIONS_BASE}/:key/translations`,
    ({ params }) => {
      const key = String(params.key);
      const found = getAttributeDefinitionByKey(key);
      if (!found)
        return HttpResponse.json({ detail: "Not found" }, { status: 404 });
      const set = getAttributeDefinitionTranslations(key);
      return HttpResponse.json({ attribute_key: key, ...set });
    },
  ),
  http.put(
    `${ATTRIBUTE_DEFINITIONS_BASE}/:key/translations`,
    async ({ params, request }) => {
      const key = String(params.key);
      const body = (await request.json().catch(() => ({}))) as {
        field_translations?: Array<{ locale?: unknown; enum_value?: unknown }>;
        enum_value_translations?: Array<{
          locale?: unknown;
          enum_value?: unknown;
        }>;
      };
      const fields = Array.isArray(body.field_translations)
        ? body.field_translations
        : [];
      const enums = Array.isArray(body.enum_value_translations)
        ? body.enum_value_translations
        : [];
      // Backend parity: unique locale (field) and unique (locale, enum_value).
      const fieldLocales = new Set<string>();
      for (const f of fields) {
        const loc = String(f.locale ?? "");
        if (fieldLocales.has(loc)) {
          return HttpResponse.json(
            {
              error: {
                message: "Request cannot be processed",
                meta: { original_detail: `Duplicate field locale: ${loc}` },
              },
            },
            { status: 400 },
          );
        }
        fieldLocales.add(loc);
      }
      const enumPairs = new Set<string>();
      for (const e of enums) {
        const pair = `${String(e.locale ?? "")}|${String(e.enum_value ?? "")}`;
        if (enumPairs.has(pair)) {
          return HttpResponse.json(
            {
              error: {
                message: "Request cannot be processed",
                meta: {
                  original_detail: `Duplicate enum translation: ${pair}`,
                },
              },
            },
            { status: 400 },
          );
        }
        enumPairs.add(pair);
      }
      const set = setAttributeDefinitionTranslations(
        key,
        body as never,
      );
      if (!set)
        return HttpResponse.json({ detail: "Not found" }, { status: 404 });
      return HttpResponse.json({ attribute_key: key, ...set });
    },
  ),
```

> NOTE on route order: `:key/translations` (2 segments) and `:key` (1 segment) never collide in path-to-regexp, but keeping the translations routes grouped with the rest of the attribute-definitions slice keeps the file readable.

- [ ] **Step 3: Type-check + commit**

Run: `npm run build` (mock env) → PASS.

```bash
git add src/mocks/attribute-definitions-store.ts src/mocks/handlers.ts
git commit -m "feat(attr-translations): MSW store + GET/PUT translation handlers"
```

---

## Task 3: TranslationsEditor component + server action

**Files:**
- Create: `src/app/(routes)/attribute-definitions/[key]/translations/actions.ts`
- Create: `src/app/(routes)/attribute-definitions/[key]/translations/_components/TranslationsEditor.tsx`

- [ ] **Step 1: Write `actions.ts`** (reuses `ActionState` from the F9 `action-types.ts`):

```typescript
// src/app/(routes)/attribute-definitions/[key]/translations/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { putAttributeDefinitionTranslations } from "@/lib/attribute-definitions/api";
import type { AttributeDefinitionTranslationsPayload } from "@/lib/attribute-definitions/types";
import type { ActionState } from "../../action-types";

function fail(message: string): ActionState {
  return { ok: false, error: message };
}

const fieldSchema = z.object({
  locale: z.string().trim().min(2).max(10),
  label: z.string().trim().min(1).max(200),
  description: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
});
const enumSchema = z.object({
  locale: z.string().trim().min(2).max(10),
  enum_value: z.string().trim().min(1).max(255),
  label: z.string().trim().min(1).max(200),
});

function parseJson(formData: FormData, key: string): unknown {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return [];
  return JSON.parse(raw); // caller wraps in try/catch
}

export async function saveTranslationsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const key = formData.get("attribute_key");
  if (typeof key !== "string" || key.trim() === "")
    return fail("Invalid attribute key");

  let fieldsRaw: unknown;
  let enumsRaw: unknown;
  try {
    fieldsRaw = parseJson(formData, "field_translations");
    enumsRaw = parseJson(formData, "enum_value_translations");
  } catch {
    return fail("Invalid translations data");
  }

  const fields = z.array(fieldSchema).safeParse(fieldsRaw);
  if (!fields.success) return fail("Invalid field translations");
  const enums = z.array(enumSchema).safeParse(enumsRaw);
  if (!enums.success) return fail("Invalid enum translations");

  // Client mirrors these, but enforce uniqueness server-side too.
  const fieldLocales = new Set<string>();
  for (const f of fields.data) {
    if (fieldLocales.has(f.locale))
      return fail(`Duplicate field locale: ${f.locale}`);
    fieldLocales.add(f.locale);
  }
  const enumPairs = new Set<string>();
  for (const e of enums.data) {
    const pair = `${e.locale}|${e.enum_value}`;
    if (enumPairs.has(pair))
      return fail(`Duplicate enum translation: ${e.locale}/${e.enum_value}`);
    enumPairs.add(pair);
  }

  const payload: AttributeDefinitionTranslationsPayload = {
    field_translations: fields.data,
    enum_value_translations: enums.data,
  };
  const result = await putAttributeDefinitionTranslations(key, payload);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath(`/attribute-definitions/${encodeURIComponent(key)}/translations`);
  return { ok: true, error: null };
}
```

- [ ] **Step 2: Write `TranslationsEditor.tsx`**:

```typescript
// src/app/(routes)/attribute-definitions/[key]/translations/_components/TranslationsEditor.tsx
"use client";
import { useActionState, useState } from "react";
import { saveTranslationsAction } from "../actions";
import { EMPTY_STATE } from "../../../action-types";
import type {
  AttributeEnumTranslation,
  AttributeFieldTranslation,
} from "@/lib/attribute-definitions/types";

type FieldRow = { locale: string; label: string; description: string };
type EnumRow = { locale: string; enum_value: string; label: string };

export function TranslationsEditor({
  attrKey,
  initialFields,
  initialEnums,
}: {
  attrKey: string;
  initialFields: AttributeFieldTranslation[];
  initialEnums: AttributeEnumTranslation[];
}) {
  const [state, formAction, pending] = useActionState(
    saveTranslationsAction,
    EMPTY_STATE,
  );
  const [fields, setFields] = useState<FieldRow[]>(
    initialFields.map((f) => ({
      locale: f.locale,
      label: f.label,
      description: f.description ?? "",
    })),
  );
  const [enums, setEnums] = useState<EnumRow[]>(
    initialEnums.map((e) => ({
      locale: e.locale,
      enum_value: e.enum_value,
      label: e.label,
    })),
  );

  // Derived (at render) JSON for the hidden fields — drop fully-blank rows.
  const fieldsJson = JSON.stringify(
    fields
      .filter((f) => f.locale.trim() || f.label.trim())
      .map((f) => ({
        locale: f.locale.trim(),
        label: f.label.trim(),
        description: f.description.trim() === "" ? null : f.description.trim(),
      })),
  );
  const enumsJson = JSON.stringify(
    enums
      .filter((e) => e.locale.trim() || e.enum_value.trim() || e.label.trim())
      .map((e) => ({
        locale: e.locale.trim(),
        enum_value: e.enum_value.trim(),
        label: e.label.trim(),
      })),
  );

  // Client-side duplicate guard (backend is source of truth).
  const dupField = (() => {
    const seen = new Set<string>();
    for (const f of fields) {
      const l = f.locale.trim();
      if (!l) continue;
      if (seen.has(l)) return l;
      seen.add(l);
    }
    return null;
  })();
  const dupEnum = (() => {
    const seen = new Set<string>();
    for (const e of enums) {
      const k = `${e.locale.trim()}|${e.enum_value.trim()}`;
      if (k === "|") continue;
      if (seen.has(k)) return k;
      seen.add(k);
    }
    return null;
  })();
  const blocked = dupField !== null || dupEnum !== null;

  function setField(i: number, patch: Partial<FieldRow>) {
    setFields((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  }
  function setEnum(i: number, patch: Partial<EnumRow>) {
    setEnums((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  }

  return (
    <form action={formAction} data-testid="translations-form" className="space-y-8">
      <input type="hidden" name="attribute_key" value={attrKey} />
      <input type="hidden" name="field_translations" value={fieldsJson} />
      <input type="hidden" name="enum_value_translations" value={enumsJson} />

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Field translations</h2>
        {fields.map((f, i) => (
          <div key={i} className="flex gap-2" data-testid={`field-row-${i}`}>
            <input
              aria-label="locale"
              data-testid={`field-locale-${i}`}
              placeholder="locale (en)"
              value={f.locale}
              onChange={(e) => setField(i, { locale: e.target.value })}
              className="w-24 rounded border px-2 py-1"
            />
            <input
              aria-label="label"
              data-testid={`field-label-${i}`}
              placeholder="Label"
              value={f.label}
              onChange={(e) => setField(i, { label: e.target.value })}
              className="flex-1 rounded border px-2 py-1"
            />
            <input
              aria-label="description"
              data-testid={`field-desc-${i}`}
              placeholder="Description (optional)"
              value={f.description}
              onChange={(e) => setField(i, { description: e.target.value })}
              className="flex-1 rounded border px-2 py-1"
            />
            <button
              type="button"
              data-testid={`field-remove-${i}`}
              onClick={() => setFields((r) => r.filter((_, idx) => idx !== i))}
              className="rounded border px-2 py-1 text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          data-testid="field-add"
          onClick={() =>
            setFields((r) => [...r, { locale: "", label: "", description: "" }])
          }
          className="rounded border px-3 py-1"
        >
          Add locale
        </button>
        {dupField ? (
          <p data-testid="field-dup-error" className="text-sm text-red-700">
            Duplicate field locale: {dupField}
          </p>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Enum-value translations</h2>
        {enums.map((e, i) => (
          <div key={i} className="flex gap-2" data-testid={`enum-row-${i}`}>
            <input
              aria-label="enum locale"
              data-testid={`enum-locale-${i}`}
              placeholder="locale (en)"
              value={e.locale}
              onChange={(ev) => setEnum(i, { locale: ev.target.value })}
              className="w-24 rounded border px-2 py-1"
            />
            <input
              aria-label="enum value"
              data-testid={`enum-value-${i}`}
              placeholder="enum value"
              value={e.enum_value}
              onChange={(ev) => setEnum(i, { enum_value: ev.target.value })}
              className="flex-1 rounded border px-2 py-1"
            />
            <input
              aria-label="enum label"
              data-testid={`enum-label-${i}`}
              placeholder="Label"
              value={e.label}
              onChange={(ev) => setEnum(i, { label: ev.target.value })}
              className="flex-1 rounded border px-2 py-1"
            />
            <button
              type="button"
              data-testid={`enum-remove-${i}`}
              onClick={() => setEnums((r) => r.filter((_, idx) => idx !== i))}
              className="rounded border px-2 py-1 text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          data-testid="enum-add"
          onClick={() =>
            setEnums((r) => [...r, { locale: "", enum_value: "", label: "" }])
          }
          className="rounded border px-3 py-1"
        >
          Add enum translation
        </button>
        {dupEnum ? (
          <p data-testid="enum-dup-error" className="text-sm text-red-700">
            Duplicate enum translation: {dupEnum}
          </p>
        ) : null}
      </section>

      <div className="space-y-2">
        <button
          type="submit"
          disabled={pending || blocked}
          data-testid="translations-submit"
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save translations"}
        </button>
        {state && !state.ok && state.error ? (
          <p data-testid="translations-error" className="text-sm text-red-700">
            {state.error}
          </p>
        ) : null}
        {state && state.ok && !pending ? (
          <p data-testid="translations-saved" className="text-sm text-green-700">
            Saved.
          </p>
        ) : null}
      </div>
    </form>
  );
}
```

> The hidden `field_translations` / `enum_value_translations` JSON is derived from state at render (React-19-safe, same idiom as `DescriptorEditor`). Submit is gated on `blocked` (client dup guard) — backend remains the source of truth and its 400 is surfaced via `state.error`.
> NOTE the `EMPTY_STATE` import path from `[key]/translations/_components/`: `../../../action-types` (→ translations/ → [key]/ → attribute-definitions/). The action's import from `[key]/translations/actions.ts` is `../../action-types`.

- [ ] **Step 3: Type-check + commit**

Run: `npm run build` (mock env) → PASS.

```bash
git add "src/app/(routes)/attribute-definitions/[key]/translations/actions.ts" "src/app/(routes)/attribute-definitions/[key]/translations/_components/TranslationsEditor.tsx"
git commit -m "feat(attr-translations): server action + dynamic TranslationsEditor"
```

---

## Task 4: Translations page + detail-page link

**Files:**
- Create: `src/app/(routes)/attribute-definitions/[key]/translations/page.tsx`
- Modify: `src/app/(routes)/attribute-definitions/[key]/page.tsx` (add a link)

- [ ] **Step 1: Write `translations/page.tsx`**:

```typescript
// src/app/(routes)/attribute-definitions/[key]/translations/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAttributeDefinition,
  getAttributeDefinitionTranslations,
} from "@/lib/attribute-definitions/api";
import { TranslationsEditor } from "./_components/TranslationsEditor";

export default async function AttributeDefinitionTranslationsPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const decodedKey = decodeURIComponent(key);
  const [defRes, trRes] = await Promise.all([
    getAttributeDefinition(decodedKey),
    getAttributeDefinitionTranslations(decodedKey),
  ]);

  if (defRes.status === 404 || trRes.status === 404) notFound();
  if (!trRes.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Translations</h1>
        <div
          data-testid="translations-load-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {trRes.status === 403
            ? "Editing translations requires an admin role."
            : `Failed to load translations: ${trRes.message}`}
        </div>
      </div>
    );
  }

  const tr = trRes.data;
  // Key-remount so a revalidated GET resets the editor's seeded state.
  const formKey = `${tr.attribute_key}:${tr.field_translations.length}:${tr.enum_value_translations.length}`;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" data-testid="translations-heading">
          {decodedKey} · Translations
        </h1>
        <Link
          href={`/attribute-definitions/${encodeURIComponent(decodedKey)}`}
          className="text-sm text-blue-700"
        >
          ← Back to definition
        </Link>
      </div>
      <div className="mt-4 max-w-3xl">
        <TranslationsEditor
          key={formKey}
          attrKey={tr.attribute_key}
          initialFields={tr.field_translations}
          initialEnums={tr.enum_value_translations}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the "Manage translations" link to the detail page** — in `src/app/(routes)/attribute-definitions/[key]/page.tsx`, inside the `<div className="mt-4 max-w-2xl space-y-6">`, after the `<AttributeDefinitionForm … />` and before the delete button, add:

```tsx
        <Link
          href={`/attribute-definitions/${encodeURIComponent(definition.key)}/translations`}
          data-testid="manage-translations-link"
          className="inline-block text-sm text-blue-700"
        >
          Manage translations →
        </Link>
```
Add `import Link from "next/link";` at the top of that file if not already present.

- [ ] **Step 3: Type-check + commit**

Run: `npm run build` (mock env) → PASS. Confirm `/attribute-definitions/[key]/translations` appears in the route list.

```bash
git add "src/app/(routes)/attribute-definitions/[key]/translations/page.tsx" "src/app/(routes)/attribute-definitions/[key]/page.tsx"
git commit -m "feat(attr-translations): translations sub-route page + detail link"
```

---

## Task 5: E2E tests

**Files:**
- Create: `tests/attribute-definitions-translations.spec.ts`

**Isolation:** shared store across the e2e run (workers:1, no reset). The seeded `cuisine` translations are asserted by the render test; mutation tests create their OWN definition + translations so they never disturb `cuisine` (which the render test reads) or the F9 list/crud/guards specs.

- [ ] **Step 1: Write the spec**:

```typescript
// tests/attribute-definitions-translations.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test.describe("Attribute definition translations", () => {
  test("detail page links to translations; seeded set renders", async ({
    page,
  }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/cuisine");
    await page.getByTestId("manage-translations-link").click();
    await page.waitForURL("**/attribute-definitions/cuisine/translations");
    await expect(page.getByTestId("translations-heading")).toContainText(
      "cuisine",
    );
    // Seeded: 2 field rows (en, ru) + 1 enum row.
    await expect(page.getByTestId("field-locale-0")).toHaveValue("en");
    await expect(page.getByTestId("field-locale-1")).toHaveValue("ru");
    await expect(page.getByTestId("enum-value-0")).toHaveValue("italian");
  });

  test("add + persist field and enum translations on a fresh definition", async ({
    page,
  }) => {
    // Create an OWN definition (never touch the seeded cuisine set).
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await page.getByTestId("attribute-definition-key").fill("tr_target");
    await page.getByTestId("descriptor-input").fill('{"type":"string"}');
    await page.getByTestId("attribute-definition-submit").click();
    await expect(page.getByTestId("attribute-definition-detail-key")).toHaveText(
      "tr_target",
    );

    await page.getByTestId("manage-translations-link").click();
    await page.waitForURL("**/attribute-definitions/tr_target/translations");

    // No rows yet → add one field + one enum.
    await page.getByTestId("field-add").click();
    await page.getByTestId("field-locale-0").fill("en");
    await page.getByTestId("field-label-0").fill("Target");
    await page.getByTestId("enum-add").click();
    await page.getByTestId("enum-locale-0").fill("en");
    await page.getByTestId("enum-value-0").fill("opt_a");
    await page.getByTestId("enum-label-0").fill("Option A");
    await page.getByTestId("translations-submit").click();
    await expect(page.getByTestId("translations-saved")).toBeVisible();

    // Reload → persisted.
    await page.goto("/attribute-definitions/tr_target/translations");
    await expect(page.getByTestId("field-locale-0")).toHaveValue("en");
    await expect(page.getByTestId("field-label-0")).toHaveValue("Target");
    await expect(page.getByTestId("enum-value-0")).toHaveValue("opt_a");
  });

  test("remove a field row and persist", async ({ page }) => {
    // Fresh definition seeded with one field translation via the UI.
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await page.getByTestId("attribute-definition-key").fill("tr_remove");
    await page.getByTestId("descriptor-input").fill('{"type":"string"}');
    await page.getByTestId("attribute-definition-submit").click();
    await page.getByTestId("manage-translations-link").click();
    await page.waitForURL("**/attribute-definitions/tr_remove/translations");
    await page.getByTestId("field-add").click();
    await page.getByTestId("field-locale-0").fill("en");
    await page.getByTestId("field-label-0").fill("Removable");
    await page.getByTestId("translations-submit").click();
    await expect(page.getByTestId("translations-saved")).toBeVisible();

    // Remove it, save, reload → gone.
    await page.getByTestId("field-remove-0").click();
    await page.getByTestId("translations-submit").click();
    await expect(page.getByTestId("translations-saved")).toBeVisible();
    await page.goto("/attribute-definitions/tr_remove/translations");
    await expect(page.getByTestId("field-row-0")).toHaveCount(0);
  });

  test("duplicate field locale blocks submit", async ({ page }) => {
    await loginAsMockAdmin(page, "/attribute-definitions/new");
    await page.getByTestId("attribute-definition-key").fill("tr_dup");
    await page.getByTestId("descriptor-input").fill('{"type":"string"}');
    await page.getByTestId("attribute-definition-submit").click();
    await page.getByTestId("manage-translations-link").click();
    await page.waitForURL("**/attribute-definitions/tr_dup/translations");
    await page.getByTestId("field-add").click();
    await page.getByTestId("field-locale-0").fill("en");
    await page.getByTestId("field-label-0").fill("One");
    await page.getByTestId("field-add").click();
    await page.getByTestId("field-locale-1").fill("en");
    await page.getByTestId("field-label-1").fill("Two");
    await expect(page.getByTestId("field-dup-error")).toBeVisible();
    await expect(page.getByTestId("translations-submit")).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run the new spec**

Run: `npm run test:e2e -- attribute-definitions-translations`
Expected: all 4 tests PASS. If the create→detail→manage-translations flow races (submit not settled before click), add `await expect(page.getByTestId("attribute-definition-submit")).toHaveText("Create")` before navigating, or `await page.waitForURL` on the detail URL first.

- [ ] **Step 3: Commit**

```bash
git add tests/attribute-definitions-translations.spec.ts
git commit -m "test(attr-translations): render, add/persist, remove, duplicate-guard e2e"
```

---

## Task 6: Whole-feature verification + PR

- [ ] **Step 1: Lint** — `npm run lint` → clean.
- [ ] **Step 2: Build** — `npm run build` (mock env) → PASS; `/attribute-definitions/[key]/translations` registered.
- [ ] **Step 3: Full e2e** — `npm run test:e2e` → all green (new spec + no F9/categories/etc. regression).
- [ ] **Step 4: Open PR → base `main`**

```bash
git push -u origin feat/eventup-admin-attr-translations
gh pr create --base main --title "feat(attr-translations): attribute-definition translations editor (F10)" --body "<summary + verification + 'sub-resource of F9; sub-route /attribute-definitions/[key]/translations; full-replace upsert, no delete'>"
```

- [ ] **Step 5: Self-review + CI gate.** Fetch `gh pr diff`; scan for stale `id`/`category` copy-paste, silent failures, scope creep. Wait for `ci.yml` green. **Do NOT merge** until user confirms-this-turn (base `main`, live users) AND live smoke is green.

---

## Self-Review (plan author)

**Spec coverage:** sub-route page (Task 4), GET/PUT client (Task 1), editor with two row-lists + add/remove + hidden-JSON serialize + client dup guard (Task 3), server action Zod + dup check (Task 3), detail-page link (Task 4), mock store+handlers incl. dup→400 parity (Task 2), tests render/add/remove/dup (Task 5), verification (Task 6). All spec sections map to a task. ✔

**Placeholder scan:** PR body has a `<summary…>` placeholder — filled at ship time from real output. No code placeholders. ✔

**Type consistency:** `AttributeFieldTranslation` / `AttributeEnumTranslation` / `AttributeDefinitionTranslations` / `AttributeDefinitionTranslationsPayload` consistent across types/api/store/action/editor/page. Store accessors `getAttributeDefinitionTranslations` / `setAttributeDefinitionTranslations` match between Task 2 (def) and the handlers (use). API fns `getAttributeDefinitionTranslations` / `putAttributeDefinitionTranslations` match between Task 1 (def) and Tasks 3–4 (use). `saveTranslationsAction` matches between Task 3 (def) and the editor import. `EMPTY_STATE`/`ActionState` import depths verified (`../../action-types` from actions.ts; `../../../action-types` from the editor under `_components/`). testids consistent between editor (Task 3) and tests (Task 5). ✔

**Naming caution flagged:** the store fn `getAttributeDefinitionTranslations` shares its name with the API client fn of the same name — they live in different modules (`@/mocks/...` vs `@/lib/...`) and are never imported together, so no collision; intentional parallel naming.
