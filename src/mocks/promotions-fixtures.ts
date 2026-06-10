// src/mocks/promotions-fixtures.ts
//
// Seed data for the promotions CATALOG mock store. Mirrors the backend Read
// shapes (promotions_admin_schemas.py). base_price is a Decimal-string.
import type {
  DiscountRuleRead,
  MonthlyDiscountRead,
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
