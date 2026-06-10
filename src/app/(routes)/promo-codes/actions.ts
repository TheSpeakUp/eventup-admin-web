// src/app/(routes)/promo-codes/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createPromoCode,
  deactivatePromoCode,
  updatePromoCode,
} from "@/lib/promo-codes/api";
import {
  buildTargetingTree,
  isDiscountType,
  type PromoCodeCreatePayload,
  type PromoCodeUpdatePayload,
} from "@/lib/promo-codes/types";
import type { ActionState } from "./action-types";

function fail(message: string): ActionState {
  return { ok: false, error: message };
}

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

// Parse a comma/space/newline separated list of positive integer ids. Returns
// { ok, ids } — ids may be empty (= no targeting on that dimension). Rejects
// any non-positive-integer token.
function parseIdList(
  raw: string | undefined,
): { ok: true; ids: number[] } | { ok: false; error: string } {
  if (raw === undefined) return { ok: true, ids: [] };
  const tokens = raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  const ids: number[] = [];
  for (const t of tokens) {
    const n = Number(t);
    if (!Number.isInteger(n) || n < 1) {
      return { ok: false, error: `Invalid id "${t}" — must be a positive integer` };
    }
    ids.push(n);
  }
  // Dedupe preserving the backend's sorted-set normalization.
  return { ok: true, ids: Array.from(new Set(ids)).sort((a, b) => a - b) };
}

// Convert a local datetime-local string ("2026-01-31T08:30") to an ISO value
// the backend parses, or undefined when blank.
function dateField(formData: FormData, key: string): string | undefined {
  const v = str(formData, key);
  if (v === undefined) return undefined;
  return v;
}

// Collect the three targeting dimensions into a rule-tree (or null).
function buildTargeting(
  formData: FormData,
):
  | { ok: true; tree: ReturnType<typeof buildTargetingTree> }
  | { ok: false; error: string } {
  const provider = parseIdList(str(formData, "target_provider_ids"));
  if (!provider.ok) return { ok: false, error: provider.error };
  const category = parseIdList(str(formData, "target_category_ids"));
  if (!category.ok) return { ok: false, error: category.error };
  const location = parseIdList(str(formData, "target_location_ids"));
  if (!location.ok) return { ok: false, error: location.error };
  return {
    ok: true,
    tree: buildTargetingTree({
      provider: provider.ids,
      category: category.ids,
      location: location.ids,
    }),
  };
}

export async function createPromoCodeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const code = str(formData, "code");
  if (!code) return fail("Code is required");
  if (code.length < 3 || code.length > 50)
    return fail("Code must be 3–50 characters");

  const discountTypeRaw = str(formData, "discount_type");
  if (!discountTypeRaw || !isDiscountType(discountTypeRaw))
    return fail("Discount type must be percent or fixed_amount");

  const discountValue = str(formData, "discount_value");
  if (!discountValue) return fail("Discount value is required");
  const dv = Number(discountValue);
  if (!Number.isFinite(dv) || dv <= 0)
    return fail("Discount value must be greater than 0");

  const payload: PromoCodeCreatePayload = {
    code,
    discount_type: discountTypeRaw,
    discount_value: discountValue, // sent as string (Decimal)
  };

  const currency = str(formData, "currency");
  if (currency !== undefined) payload.currency = currency;
  if (discountTypeRaw === "fixed_amount" && currency === undefined)
    return fail("Currency is required for a fixed-amount discount");

  const maxUsesRaw = str(formData, "max_uses");
  if (maxUsesRaw !== undefined) {
    const n = Number(maxUsesRaw);
    if (!Number.isInteger(n) || n < 1)
      return fail("Max uses must be an integer ≥ 1");
    payload.max_uses = n;
  }

  const minOrderRaw = str(formData, "min_order_amount_minor");
  if (minOrderRaw !== undefined) {
    const n = Number(minOrderRaw);
    if (!Number.isInteger(n) || n < 0)
      return fail("Min order amount (minor units) must be an integer ≥ 0");
    payload.min_order_amount_minor = n;
  }

  const itemTypesRaw = str(formData, "allowed_item_types");
  if (itemTypesRaw !== undefined) {
    const types = itemTypesRaw
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (types.length > 0) payload.allowed_item_types = types;
  }

  const validFrom = dateField(formData, "valid_from");
  if (validFrom !== undefined) payload.valid_from = validFrom;
  const validUntil = dateField(formData, "valid_until");
  if (validUntil !== undefined) payload.valid_until = validUntil;

  const stripeCoupon = str(formData, "stripe_coupon_id");
  if (stripeCoupon !== undefined) payload.stripe_coupon_id = stripeCoupon;

  payload.is_active = formData.get("is_active") !== null;

  const targeting = buildTargeting(formData);
  if (!targeting.ok) return fail(targeting.error);
  payload.targeting_rules = targeting.tree;

  const result = await createPromoCode(payload);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath("/promo-codes");
  redirect(`/promo-codes/${result.data.id}`);
}

export async function updatePromoCodeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) return fail("Invalid promo code id");

  const payload: PromoCodeUpdatePayload = {};

  // is_active is a checkbox — always send it on edit (present semantics).
  payload.is_active = formData.get("is_active") !== null;

  const validUntil = dateField(formData, "valid_until");
  // Blank clears the field — distinguish "field rendered" via a hidden marker.
  if (formData.get("valid_until") !== null) {
    payload.valid_until = validUntil ?? null;
  }

  const maxUsesRaw = str(formData, "max_uses");
  if (maxUsesRaw !== undefined) {
    const n = Number(maxUsesRaw);
    if (!Number.isInteger(n) || n < 1)
      return fail("Max uses must be an integer ≥ 1");
    payload.max_uses = n;
  }

  const targeting = buildTargeting(formData);
  if (!targeting.ok) return fail(targeting.error);
  payload.targeting_rules = targeting.tree;

  const result = await updatePromoCode(id, payload);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath(`/promo-codes/${id}`);
  revalidatePath("/promo-codes");
  return { ok: true, error: null };
}

export async function deactivatePromoCodeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) return fail("Invalid promo code id");
  const result = await deactivatePromoCode(id);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath(`/promo-codes/${id}`);
  revalidatePath("/promo-codes");
  return { ok: true, error: null };
}
