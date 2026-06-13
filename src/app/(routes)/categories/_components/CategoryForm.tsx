// src/app/(routes)/categories/_components/CategoryForm.tsx
"use client";
import { useActionState } from "react";
import { createCategoryAction, updateCategoryAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import type { CategoryRead } from "@/lib/categories/types";
import Button from "@/app/_components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/app/_components/ui/Field";
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

      <FormField label="Name">
        <Input
          name="name"
          data-testid="category-name"
          defaultValue={c?.name ?? ""}
          required={mode === "create"}
        />
      </FormField>

      <FormField label="Slug">
        <Input
          name="slug"
          data-testid="category-slug"
          defaultValue={c?.slug ?? ""}
          required={mode === "create"}
        />
      </FormField>

      <FormField label="Icon">
        <Input name="icon" defaultValue={c?.icon ?? ""} />
      </FormField>

      <FormField label="Description">
        <Textarea name="description" defaultValue={c?.description ?? ""} />
      </FormField>

      <FormField label="Sort order">
        <Input
          name="sort_order"
          type="number"
          defaultValue={c?.sort_order ?? 100}
        />
      </FormField>

      <FormField label="Parent">
        <Select
          name="parent_id"
          data-testid="category-parent"
          defaultValue={c?.parent_id != null ? String(c.parent_id) : ""}
        >
          <option value="">— none —</option>
          {parentOptions
            .filter((p) => p.id !== c?.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </Select>
      </FormField>

      <fieldset className="grid grid-cols-3 gap-2">
        <legend className="text-sm font-medium text-ink">
          Publication pricing
        </legend>
        <Input
          name="publication_currency"
          placeholder="USD"
          defaultValue={c?.publication_currency ?? ""}
        />
        <Input
          name="publication_price_monthly"
          placeholder="Monthly"
          defaultValue={c?.publication_price_monthly ?? ""}
        />
        <Input
          name="publication_price_monthly_discounted"
          placeholder="Discounted"
          defaultValue={c?.publication_price_monthly_discounted ?? ""}
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

      <Button type="submit" disabled={pending} data-testid="category-submit">
        {pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
      </Button>
      {state && !state.ok && state.error ? (
        <p data-testid="category-error" className="text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
