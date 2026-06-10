// src/mocks/promotions-fixtures.ts
//
// Seed data for the promotions CATALOG mock store. Mirrors the backend Read
// shapes (promotions_admin_schemas.py). base_price is a Decimal-string.
import type {
  CampaignRead,
  DiscountRuleRead,
  MonthlyDiscountRead,
  OrderItemRead,
  OrderListItem,
  OrderRead,
  ProductRead,
  TariffRead,
  ZoneRead,
} from "@/lib/promotions/types";

export function buildFixtureProducts(): ProductRead[] {
  return [
    {
      id: 1,
      code: "featured_listing",
      name_translations: { en: "Featured listing", ar: "قائمة مميزة" },
      description_translations: { en: "Top placement in search" },
      default_billing_unit: "week",
      service_scope: "service",
      period_type: "calendar",
      is_active: true,
    },
    {
      id: 2,
      code: "homepage_banner",
      name_translations: { en: "Homepage banner" },
      description_translations: null,
      default_billing_unit: "day",
      service_scope: "service",
      period_type: "calendar",
      is_active: true,
    },
    {
      id: 3,
      code: "legacy_spotlight",
      name_translations: { en: "Legacy spotlight" },
      description_translations: null,
      default_billing_unit: "month",
      service_scope: "service",
      period_type: "calendar",
      is_active: false,
    },
  ];
}

export function buildFixtureTariffs(): TariffRead[] {
  return [
    {
      id: 1,
      product_id: 1,
      billing_unit: "week",
      base_price: "49.00",
      currency: "USD",
      volume_per_unit: null,
      min_units: 1,
    },
    {
      id: 2,
      product_id: 2,
      billing_unit: "day",
      base_price: "15.00",
      currency: "USD",
      volume_per_unit: null,
      min_units: 3,
    },
  ];
}

export function buildFixtureDiscountRules(): DiscountRuleRead[] {
  return [
    {
      id: 1,
      product_id: 1,
      tariff_id: null,
      min_units: 4,
      discount_percent: 10,
      valid_from: null,
      valid_to: null,
      is_active: true,
    },
    {
      id: 2,
      product_id: null,
      tariff_id: 2,
      min_units: 7,
      discount_percent: 15,
      valid_from: "2026-01-01",
      valid_to: "2026-12-31",
      is_active: true,
    },
  ];
}

export function buildFixtureMonthlyDiscounts(): MonthlyDiscountRead[] {
  return [
    {
      id: 1,
      product_id: 1,
      tariff_id: null,
      month_start: "2026-06-01",
      discount_percent: 20,
      max_campaigns_total: 100,
      max_campaigns_per_service: 2,
      is_active: true,
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    },
  ];
}

export function buildFixtureZones(): ZoneRead[] {
  return [
    {
      id: 1,
      code: "search_top",
      time_granularity: "day",
      max_slots: 5,
    },
    {
      id: 2,
      code: "homepage_hero",
      time_granularity: "week",
      max_slots: 1,
    },
  ];
}

// Orders carry their full line-item set; the list endpoint projects a summary
// (OrderListItem) off the same record (see promotions-store).
export function buildFixtureOrders(): OrderRead[] {
  const item = (
    over: Partial<OrderItemRead> & Pick<OrderItemRead, "id" | "order_id">,
  ): OrderItemRead => ({
    tariff_id: 1,
    item_type: "placement",
    units: 2,
    unit_price: "49.00",
    discount_percent: 0,
    discount_amount: "0.00",
    final_price: "98.00",
    period_start: "2026-06-01",
    period_unit: "week",
    periods_count: 2,
    ...over,
  });
  return [
    {
      id: 1,
      service_id: 501,
      status: "paid",
      total_price: "98.00",
      currency: "USD",
      created_at: new Date("2026-06-01T10:00:00Z").toISOString(),
      paid_at: new Date("2026-06-01T10:05:00Z").toISOString(),
      items: [item({ id: 1, order_id: 1 })],
    },
    {
      id: 2,
      service_id: 502,
      status: "pending",
      total_price: "15.00",
      currency: "USD",
      created_at: new Date("2026-06-02T09:00:00Z").toISOString(),
      paid_at: null,
      items: [
        item({
          id: 2,
          order_id: 2,
          tariff_id: 2,
          units: 1,
          unit_price: "15.00",
          final_price: "15.00",
          period_unit: "day",
          periods_count: 1,
        }),
      ],
    },
  ];
}

export function toOrderListItem(o: OrderRead): OrderListItem {
  return {
    id: o.id,
    service_id: o.service_id,
    status: o.status,
    total_price: o.total_price,
    currency: o.currency,
    created_at: o.created_at,
    paid_at: o.paid_at,
  };
}

// Campaign #1 is active → cancelable; #2 is already canceled (status-gated, no
// Cancel button). #3 is active in the list (so it DOES render a Cancel button)
// but the backend rejects its cancel with a 4xx — it exercises the cancel
// error-display path end to end (see NON_CANCELABLE_CAMPAIGN_IDS in the store).
export function buildFixtureCampaigns(): CampaignRead[] {
  return [
    {
      id: 1,
      order_item_id: 1,
      service_id: 501,
      product_id: 1,
      zone_id: 1,
      status: "active",
      start_date: "2026-06-01",
      end_date: "2026-06-14",
      time_unit: "week",
      slots_reserved: 1,
    },
    {
      id: 2,
      order_item_id: 2,
      service_id: 502,
      product_id: 2,
      zone_id: 2,
      status: "canceled",
      start_date: "2026-06-02",
      end_date: "2026-06-05",
      time_unit: "day",
      slots_reserved: 1,
    },
    {
      id: 3,
      order_item_id: 3,
      service_id: 503,
      product_id: 1,
      zone_id: 1,
      status: "active",
      start_date: "2026-06-03",
      end_date: "2026-06-17",
      time_unit: "week",
      slots_reserved: 1,
    },
  ];
}
