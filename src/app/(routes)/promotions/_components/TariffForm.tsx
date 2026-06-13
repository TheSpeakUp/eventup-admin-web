// src/app/(routes)/promotions/_components/TariffForm.tsx
"use client";
import { useActionState } from "react";
import { createTariffAction, updateTariffAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import type { TariffRead } from "@/lib/promotions/types";

export default function TariffForm({
  mode,
  tariff,
}: {
  mode: "create" | "edit";
  tariff?: TariffRead;
}) {
  const action = mode === "create" ? createTariffAction : updateTariffAction;
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);
  const t = tariff;
  return (
    <form
      action={formAction}
      data-testid="tariff-form"
      className="space-y-3 rounded border border-zinc-200 bg-surface-1 p-4"
    >
      {mode === "edit" && t ? (
        <input type="hidden" name="id" value={t.id} />
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-zinc-700">Product id</span>
        <input
          name="product_id"
          type="number"
          data-testid="tariff-product-id"
          defaultValue={t?.product_id ?? ""}
          required={mode === "create"}
          disabled={mode === "edit"}
          className="mt-1 w-40 rounded border border-zinc-200 px-2 py-1 text-sm disabled:bg-zinc-50 disabled:text-zinc-500"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Billing unit
          </span>
          <input
            name="billing_unit"
            data-testid="tariff-billing-unit"
            defaultValue={t?.billing_unit ?? "week"}
            required={mode === "create"}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Currency</span>
          <input
            name="currency"
            data-testid="tariff-currency"
            defaultValue={t?.currency ?? "USD"}
            required={mode === "create"}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Base price</span>
          <input
            name="base_price"
            data-testid="tariff-base-price"
            placeholder="49.00"
            defaultValue={t?.base_price ?? ""}
            required={mode === "create"}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Volume / unit
          </span>
          <input
            name="volume_per_unit"
            type="number"
            defaultValue={t?.volume_per_unit ?? ""}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Min units</span>
          <input
            name="min_units"
            type="number"
            defaultValue={t?.min_units ?? 1}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        data-testid="tariff-submit"
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : mode === "create" ? "Create tariff" : "Save"}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="tariff-error" className="text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
