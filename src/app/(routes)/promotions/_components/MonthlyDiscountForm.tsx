// src/app/(routes)/promotions/_components/MonthlyDiscountForm.tsx
"use client";
import { useActionState } from "react";
import {
  createMonthlyDiscountAction,
  updateMonthlyDiscountAction,
} from "../actions";
import { EMPTY_STATE } from "../action-types";
import type { MonthlyDiscountRead } from "@/lib/promotions/types";

export default function MonthlyDiscountForm({
  mode,
  discount,
}: {
  mode: "create" | "edit";
  discount?: MonthlyDiscountRead;
}) {
  const action =
    mode === "create"
      ? createMonthlyDiscountAction
      : updateMonthlyDiscountAction;
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);
  const d = discount;
  return (
    <form
      action={formAction}
      data-testid="monthly-discount-form"
      className="space-y-3 rounded border border-zinc-200 bg-surface-1 p-4"
    >
      {mode === "edit" && d ? (
        <input type="hidden" name="id" value={d.id} />
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Product id (optional)
          </span>
          <input
            name="product_id"
            type="number"
            defaultValue={d?.product_id ?? ""}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Tariff id (optional)
          </span>
          <input
            name="tariff_id"
            type="number"
            defaultValue={d?.tariff_id ?? ""}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Month start
          </span>
          <input
            name="month_start"
            type="date"
            data-testid="monthly-discount-month-start"
            defaultValue={d?.month_start ?? ""}
            required={mode === "create"}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Discount %
          </span>
          <input
            name="discount_percent"
            type="number"
            step="0.01"
            data-testid="monthly-discount-percent"
            defaultValue={d?.discount_percent ?? ""}
            required={mode === "create"}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Max campaigns total (optional)
          </span>
          <input
            name="max_campaigns_total"
            type="number"
            defaultValue={d?.max_campaigns_total ?? ""}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Max per service (optional)
          </span>
          <input
            name="max_campaigns_per_service"
            type="number"
            defaultValue={d?.max_campaigns_per_service ?? ""}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={d?.is_active ?? true}
        />
        Active
      </label>

      <button
        type="submit"
        disabled={pending}
        data-testid="monthly-discount-submit"
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : mode === "create" ? "Create discount" : "Save"}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="monthly-discount-error" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
