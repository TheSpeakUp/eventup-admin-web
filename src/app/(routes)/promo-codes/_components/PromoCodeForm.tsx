// src/app/(routes)/promo-codes/_components/PromoCodeForm.tsx
"use client";
import { useActionState } from "react";
import { createPromoCodeAction, updatePromoCodeAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import Button from "@/app/_components/ui/Button";
import { FormField, Input, Select } from "@/app/_components/ui/Field";
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
          <FormField label="Code">
            <Input
              name="code"
              data-testid="promo-code"
              required
              minLength={3}
              maxLength={50}
            />
          </FormField>

          <div className="grid grid-cols-3 gap-2">
            <FormField label="Discount type">
              <Select
                name="discount_type"
                data-testid="promo-discount-type"
                defaultValue="percent"
              >
                <option value="percent">percent</option>
                <option value="fixed_amount">fixed_amount</option>
              </Select>
            </FormField>
            <FormField label="Discount value">
              <Input
                name="discount_value"
                data-testid="promo-discount-value"
                required
                placeholder="10"
              />
            </FormField>
            <FormField label="Currency">
              <Input
                name="currency"
                data-testid="promo-currency"
                placeholder="USD (fixed only)"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FormField label="Min order (minor units)">
              <Input
                name="min_order_amount_minor"
                data-testid="promo-min-order"
                type="number"
              />
            </FormField>
            <FormField label="Allowed item types">
              <Input
                name="allowed_item_types"
                data-testid="promo-item-types"
                placeholder="service, space (comma-separated)"
              />
            </FormField>
          </div>

          <FormField label="Valid from">
            <Input
              name="valid_from"
              data-testid="promo-valid-from"
              type="datetime-local"
            />
          </FormField>

          <FormField label="Stripe coupon id">
            <Input name="stripe_coupon_id" data-testid="promo-stripe-coupon" />
          </FormField>
        </>
      ) : (
        <div className="rounded border border-hairline bg-surface-2 p-3 text-sm text-ink-muted">
          <div>
            <span className="font-medium">Code:</span> {p?.code}
          </div>
          <div>
            <span className="font-medium">Discount:</span> {p?.discount_value}
            {p?.discount_type === "percent" ? "%" : ` ${p?.currency ?? ""}`} (
            {p?.discount_type})
          </div>
          <p className="mt-1 text-xs text-ink-subtle">
            Code and discount are immutable after creation.
          </p>
        </div>
      )}

      {/* --- Mutable fields (create + edit) --- */}
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Valid until">
          <Input
            name="valid_until"
            data-testid="promo-valid-until"
            type="datetime-local"
            defaultValue={toLocalInput(p?.valid_until)}
          />
        </FormField>
        <FormField label="Max uses">
          <Input
            name="max_uses"
            data-testid="promo-max-uses"
            type="number"
            defaultValue={p?.max_uses ?? ""}
          />
        </FormField>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_active"
          data-testid="promo-is-active"
          defaultChecked={p?.is_active ?? true}
        />
        <span className="text-sm font-medium text-ink">Active</span>
      </label>

      {/* --- Targeting (provider / category / location id lists) --- */}
      <fieldset className="space-y-2 rounded border border-hairline p-3">
        <legend className="text-sm font-medium text-ink">
          Targeting (leave blank to apply to everyone)
        </legend>
        <FormField label="Provider ids">
          <Input
            name="target_provider_ids"
            data-testid="promo-target-providers"
            placeholder="e.g. 11, 12, 13"
            defaultValue={targeting.provider.join(", ")}
          />
        </FormField>
        <FormField label="Category ids">
          <Input
            name="target_category_ids"
            data-testid="promo-target-categories"
            placeholder="e.g. 5, 6"
            defaultValue={targeting.category.join(", ")}
          />
        </FormField>
        <FormField label="Location ids">
          <Input
            name="target_location_ids"
            data-testid="promo-target-locations"
            placeholder="e.g. 42"
            defaultValue={targeting.location.join(", ")}
          />
        </FormField>
      </fieldset>

      <Button type="submit" disabled={pending} data-testid="promo-submit">
        {pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
      </Button>
      {state && !state.ok && state.error ? (
        <p data-testid="promo-error" className="text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
