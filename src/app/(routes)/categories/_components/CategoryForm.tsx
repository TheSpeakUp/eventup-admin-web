// src/app/(routes)/categories/_components/CategoryForm.tsx
"use client";
import { useActionState } from "react";
import { createCategoryAction, updateCategoryAction } from "../actions";
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
  const action =
    mode === "create" ? createCategoryAction : updateCategoryAction;
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
