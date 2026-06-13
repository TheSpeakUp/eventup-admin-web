// src/app/(routes)/promotions/_components/DiscountRuleForm.tsx
"use client";
import { useActionState } from "react";
import {
  createDiscountRuleAction,
  updateDiscountRuleAction,
} from "../actions";
import { EMPTY_STATE } from "../action-types";
import type { DiscountRuleRead } from "@/lib/promotions/types";

export default function DiscountRuleForm({
  mode,
  rule,
}: {
  mode: "create" | "edit";
  rule?: DiscountRuleRead;
}) {
  const action =
    mode === "create" ? createDiscountRuleAction : updateDiscountRuleAction;
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);
  const r = rule;
  return (
    <form
      action={formAction}
      data-testid="discount-rule-form"
      className="space-y-3 rounded border border-zinc-200 bg-surface-1 p-4"
    >
      {mode === "edit" && r ? (
        <input type="hidden" name="id" value={r.id} />
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Product id (optional)
          </span>
          <input
            name="product_id"
            type="number"
            defaultValue={r?.product_id ?? ""}
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
            defaultValue={r?.tariff_id ?? ""}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Min units</span>
          <input
            name="min_units"
            type="number"
            data-testid="discount-rule-min-units"
            defaultValue={r?.min_units ?? 1}
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
            data-testid="discount-rule-percent"
            defaultValue={r?.discount_percent ?? ""}
            required={mode === "create"}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Valid from
          </span>
          <input
            name="valid_from"
            type="date"
            defaultValue={r?.valid_from ?? ""}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Valid to</span>
          <input
            name="valid_to"
            type="date"
            defaultValue={r?.valid_to ?? ""}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={r?.is_active ?? true}
        />
        Active
      </label>

      <button
        type="submit"
        disabled={pending}
        data-testid="discount-rule-submit"
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : mode === "create" ? "Create rule" : "Save"}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="discount-rule-error" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
