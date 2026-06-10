// src/mocks/promo-codes-store.ts
import type {
  PromoCodeListResponse,
  PromoCodeRead,
  TargetingRuleTree,
} from "@/lib/promo-codes/types";
import { buildFixturePromoCodes } from "./promo-codes-fixtures";

const promoCodes = new Map<number, PromoCodeRead>();
let nextId = 100;

function ensureSeed(): void {
  if (promoCodes.size > 0) return;
  for (const p of buildFixturePromoCodes()) promoCodes.set(p.id, p);
}

export function resetPromoCodesStore(): void {
  promoCodes.clear();
  nextId = 100;
  ensureSeed();
}

export function getPromoCodeById(id: number): PromoCodeRead | null {
  ensureSeed();
  return promoCodes.get(id) ?? null;
}

export function listPromoCodesPage(opts: {
  code?: string;
  is_active?: boolean;
  item_type?: string;
  limit?: number;
  offset?: number;
}): PromoCodeListResponse {
  ensureSeed();
  let rows = Array.from(promoCodes.values());
  if (opts.code) {
    const q = opts.code.toLowerCase();
    rows = rows.filter((r) => r.code.toLowerCase().includes(q));
  }
  if (opts.is_active !== undefined) {
    rows = rows.filter((r) => r.is_active === opts.is_active);
  }
  if (opts.item_type) {
    rows = rows.filter((r) =>
      (r.allowed_item_types ?? []).includes(opts.item_type as string),
    );
  }
  // Newest first (descending id) — mirrors a created_at desc backend ordering.
  rows.sort((a, b) => b.id - a.id);
  const total = rows.length;
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
  const offset = Math.max(opts.offset ?? 0, 0);
  const slice = rows.slice(offset, offset + limit);
  return {
    items: slice,
    total,
    has_more: offset + limit < total,
  };
}

export type PromoCodeWrite = {
  code?: string;
  discount_type?: string;
  discount_value?: string;
  currency?: string | null;
  max_uses?: number | null;
  min_order_amount_minor?: number | null;
  allowed_item_types?: string[] | null;
  allowed_periods_count?: number[] | null;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active?: boolean;
  stripe_coupon_id?: string | null;
  targeting_rules?: TargetingRuleTree | null;
};

export function createPromoCodeRecord(input: PromoCodeWrite): PromoCodeRead {
  ensureSeed();
  const id = nextId++;
  const record: PromoCodeRead = {
    id,
    code: input.code ?? "",
    discount_type: input.discount_type ?? "percent",
    discount_value: input.discount_value ?? "0",
    currency: input.currency ?? null,
    max_uses: input.max_uses ?? null,
    used_count: 0,
    min_order_amount_minor: input.min_order_amount_minor ?? null,
    allowed_item_types: input.allowed_item_types ?? null,
    allowed_periods_count: input.allowed_periods_count ?? null,
    valid_from: input.valid_from ?? null,
    valid_until: input.valid_until ?? null,
    is_active: input.is_active ?? true,
    stripe_coupon_id: input.stripe_coupon_id ?? null,
    targeting_rules: input.targeting_rules ?? null,
    created_at: new Date().toISOString(),
  };
  promoCodes.set(id, record);
  return record;
}

// PATCH — mutable fields only (is_active / valid_until / max_uses / targeting).
export type PromoCodePatch = {
  is_active?: boolean | null;
  valid_until?: string | null;
  max_uses?: number | null;
  targeting_rules?: TargetingRuleTree | null;
};

export function updatePromoCodeRecord(
  id: number,
  patch: PromoCodePatch,
): PromoCodeRead | null {
  ensureSeed();
  const current = promoCodes.get(id);
  if (!current) return null;
  const updated: PromoCodeRead = {
    ...current,
    ...(patch.is_active !== undefined && patch.is_active !== null
      ? { is_active: patch.is_active }
      : {}),
    ...(patch.valid_until !== undefined
      ? { valid_until: patch.valid_until }
      : {}),
    ...(patch.max_uses !== undefined ? { max_uses: patch.max_uses } : {}),
    ...(patch.targeting_rules !== undefined
      ? { targeting_rules: patch.targeting_rules }
      : {}),
  };
  promoCodes.set(id, updated);
  return updated;
}

export function deactivatePromoCodeRecord(id: number): PromoCodeRead | null {
  ensureSeed();
  const current = promoCodes.get(id);
  if (!current) return null;
  const updated = { ...current, is_active: false };
  promoCodes.set(id, updated);
  return updated;
}
