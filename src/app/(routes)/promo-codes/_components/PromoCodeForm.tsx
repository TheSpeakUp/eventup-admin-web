// src/app/(routes)/promo-codes/_components/PromoCodeForm.tsx
"use client";
import { useActionState } from "react";
import { createPromoCodeAction, updatePromoCodeAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import {
  extractTargetingIds,
  type PromoCodeRead,
} from "@/lib/promo-codes/types";

// datetime-local needs "YYYY-MM-DDTHH:MM"; backend timestamps may carry seconds
// / microseconds, so trim to minutes. Blank for null.
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export default function PromoCodeForm({
  mode,
  promoCode,
}: {
  mode: "create" | "edit";
  promoCode?: PromoCodeRead;
}) {
  const action =
    mode === "create" ? createPromoCodeAction : updatePromoCodeAction;
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);
  const p = promoCode;
  const targeting = extractTargetingIds(p?.targeting_rules);

  return (
    <form action={formAction} data-testid="promo-form" className="space-y-4">
      {mode === "edit" && p ? (
        <input type="hidden" name="id" value={p.id} />
      ) : null}

      {/* --- Immutable identity + discount (create only) --- */}
      {mode === "create" ? (
        <>
          <label className="block">
            <span className="text-sm font-medium">Code</span>
            <input
              name="code"
              data-testid="promo-code"
              required
              minLength={3}
              maxLength={50}
              className="mt-1 w-full rounded border px-2 py-1"
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <span className="text-sm font-medium">Discount type</span>
              <select
                name="discount_type"
                data-testid="promo-discount-type"
                defaultValue="percent"
                className="mt-1 w-full rounded border px-2 py-1"
              >
                <option value="percent">percent</option>
                <option value="fixed_amount">fixed_amount</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Discount value</span>
              <input
                name="discount_value"
                data-testid="promo-discount-value"
                required
                placeholder="10"
                className="mt-1 w-full rounded border px-2 py-1"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Currency</span>
              <input
                name="currency"
                data-testid="promo-currency"
                placeholder="USD (fixed only)"
                className="mt-1 w-full rounded border px-2 py-1"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-sm font-medium">
                Min order (minor units)
              </span>
              <input
                name="min_order_amount_minor"
                data-testid="promo-min-order"
                type="number"
                className="mt-1 w-full rounded border px-2 py-1"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Allowed item types</span>
              <input
                name="allowed_item_types"
                data-testid="promo-item-types"
                placeholder="service, space (comma-separated)"
                className="mt-1 w-full rounded border px-2 py-1"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium">Valid from</span>
            <input
              name="valid_from"
              data-testid="promo-valid-from"
              type="datetime-local"
              className="mt-1 w-full rounded border px-2 py-1"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Stripe coupon id</span>
            <input
              name="stripe_coupon_id"
              data-testid="promo-stripe-coupon"
              className="mt-1 w-full rounded border px-2 py-1"
            />
          </label>
        </>
      ) : (
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          <div>
            <span className="font-medium">Code:</span> {p?.code}
          </div>
          <div>
            <span className="font-medium">Discount:</span> {p?.discount_value}
            {p?.discount_type === "percent" ? "%" : ` ${p?.currency ?? ""}`} (
            {p?.discount_type})
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Code and discount are immutable after creation.
          </p>
        </div>
      )}

      {/* --- Mutable fields (create + edit) --- */}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-medium">Valid until</span>
          <input
            name="valid_until"
            data-testid="promo-valid-until"
            type="datetime-local"
            defaultValue={toLocalInput(p?.valid_until)}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Max uses</span>
          <input
            name="max_uses"
            data-testid="promo-max-uses"
            type="number"
            defaultValue={p?.max_uses ?? ""}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_active"
          data-testid="promo-is-active"
          defaultChecked={p?.is_active ?? true}
        />
        <span className="text-sm font-medium">Active</span>
      </label>

      {/* --- Targeting (provider / category / location id lists) --- */}
      <fieldset className="space-y-2 rounded border border-zinc-200 p-3">
        <legend className="text-sm font-medium">
          Targeting (leave blank to apply to everyone)
        </legend>
        <label className="block">
          <span className="text-sm">Provider ids</span>
          <input
            name="target_provider_ids"
            data-testid="promo-target-providers"
            placeholder="e.g. 11, 12, 13"
            defaultValue={targeting.provider.join(", ")}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-sm">Category ids</span>
          <input
            name="target_category_ids"
            data-testid="promo-target-categories"
            placeholder="e.g. 5, 6"
            defaultValue={targeting.category.join(", ")}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-sm">Location ids</span>
          <input
            name="target_location_ids"
            data-testid="promo-target-locations"
            placeholder="e.g. 42"
            defaultValue={targeting.location.join(", ")}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        data-testid="promo-submit"
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="promo-error" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
