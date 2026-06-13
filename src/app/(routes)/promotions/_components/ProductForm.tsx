// src/app/(routes)/promotions/_components/ProductForm.tsx
"use client";
import { useActionState } from "react";
import { createProductAction, updateProductAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import type { ProductRead } from "@/lib/promotions/types";

export default function ProductForm({
  mode,
  product,
}: {
  mode: "create" | "edit";
  product?: ProductRead;
}) {
  const action =
    mode === "create" ? createProductAction : updateProductAction;
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);
  const p = product;
  return (
    <form
      action={formAction}
      data-testid="product-form"
      className="space-y-3 rounded border border-zinc-200 bg-surface-1 p-4"
    >
      {mode === "edit" && p ? (
        <input type="hidden" name="id" value={p.id} />
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-zinc-700">Code</span>
        <input
          name="code"
          data-testid="product-code"
          defaultValue={p?.code ?? ""}
          required={mode === "create"}
          disabled={mode === "edit"}
          className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm disabled:bg-zinc-50 disabled:text-zinc-500"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-zinc-700">
          Name translations (JSON)
        </span>
        <input
          name="name_translations"
          data-testid="product-name-translations"
          placeholder='{"en":"Featured listing"}'
          defaultValue={
            p ? JSON.stringify(p.name_translations) : ""
          }
          required={mode === "create"}
          className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-zinc-700">
          Description translations (JSON, optional)
        </span>
        <input
          name="description_translations"
          placeholder='{"en":"Top placement"}'
          defaultValue={
            p?.description_translations
              ? JSON.stringify(p.description_translations)
              : ""
          }
          className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
        />
      </label>

      <div className="grid grid-cols-3 gap-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Billing unit
          </span>
          <input
            name="default_billing_unit"
            data-testid="product-billing-unit"
            defaultValue={p?.default_billing_unit ?? "week"}
            required={mode === "create"}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Service scope
          </span>
          <input
            name="service_scope"
            defaultValue={p?.service_scope ?? "service"}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Period type
          </span>
          <input
            name="period_type"
            defaultValue={p?.period_type ?? "calendar"}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="is_active"
          data-testid="product-is-active"
          defaultChecked={p?.is_active ?? true}
        />
        Active
      </label>

      <button
        type="submit"
        disabled={pending}
        data-testid="product-submit"
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : mode === "create" ? "Create product" : "Save"}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="product-error" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
