// src/mocks/promo-codes-fixtures.ts
import type { PromoCodeRead } from "@/lib/promo-codes/types";

export function buildFixturePromoCodes(): PromoCodeRead[] {
  return [
    {
      id: 1,
      code: "WELCOME10",
      discount_type: "percent",
      discount_value: "10",
      currency: null,
      max_uses: 100,
      used_count: 12,
      min_order_amount_minor: null,
      allowed_item_types: null,
      allowed_periods_count: null,
      valid_from: "2026-01-01T00:00:00",
      valid_until: "2026-12-31T23:59:59",
      is_active: true,
      stripe_coupon_id: null,
      // Targeted at 3 providers + 2 categories (flat AND tree).
      targeting_rules: {
        root: {
          op: "AND",
          rules: [
            { dimension: "provider", match: "in", values: [11, 12, 13] },
            { dimension: "category", match: "in", values: [5, 6] },
          ],
        },
      },
      created_at: "2026-01-01T08:00:00",
    },
    {
      id: 2,
      code: "FLAT500",
      discount_type: "fixed_amount",
      discount_value: "500",
      currency: "USD",
      max_uses: null,
      used_count: 0,
      min_order_amount_minor: 5000,
      allowed_item_types: ["service"],
      allowed_periods_count: null,
      valid_from: null,
      valid_until: null,
      is_active: true,
      stripe_coupon_id: "coupon_flat500",
      targeting_rules: null, // applies to everyone
      created_at: "2026-02-01T09:30:00",
    },
    {
      id: 3,
      code: "EXPIRED20",
      discount_type: "percent",
      discount_value: "20",
      currency: null,
      max_uses: 50,
      used_count: 50,
      min_order_amount_minor: null,
      allowed_item_types: null,
      allowed_periods_count: null,
      valid_from: "2025-01-01T00:00:00",
      valid_until: "2025-06-30T23:59:59",
      is_active: false,
      stripe_coupon_id: null,
      targeting_rules: {
        root: {
          op: "AND",
          rules: [{ dimension: "location", match: "in", values: [42] }],
        },
      },
      created_at: "2025-01-01T07:00:00",
    },
  ];
}
