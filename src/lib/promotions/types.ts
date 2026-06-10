// src/lib/promotions/types.ts
//
// Typed mirror of the backend M3 promotions catalog schemas
// (src/eventup/admin/marketplace/promotions_admin_schemas.py). Money / Decimal
// columns (base_price) are strings — same convention as category prices — so we
// never round-trip through float. ``discount_percent`` is a float on the
// backend (0, 100], kept as number here.

export const PROMOTIONS_TABS = [
  "products",
  "tariffs",
  "discount-rules",
  "monthly-discounts",
  "zones",
  "orders",
  "campaigns",
] as const;
export type PromotionsTab = (typeof PROMOTIONS_TABS)[number];

export function isPromotionsTab(value: string): value is PromotionsTab {
  return (PROMOTIONS_TABS as readonly string[]).includes(value);
}

// --------------------------------------------------------------------------- //
// Products — full CRUD (GET list, GET /{id}, POST, PATCH, POST /deactivate)    //
// --------------------------------------------------------------------------- //

export type ProductRead = {
  id: number;
  code: string;
  name_translations: Record<string, string>;
  description_translations: Record<string, string> | null;
  default_billing_unit: string;
  service_scope: string;
  period_type: string;
  is_active: boolean;
};

export type ProductListResponse = {
  items: ProductRead[];
  total: number;
};

// POST body. ``code`` required + immutable thereafter.
export type ProductCreatePayload = {
  code: string;
  name_translations: Record<string, string>;
  description_translations?: Record<string, string> | null;
  default_billing_unit: string;
  service_scope?: string;
  period_type?: string;
  is_active?: boolean;
};

// PATCH body — all optional, ``code`` is immutable so not present.
export type ProductUpdatePayload = {
  name_translations?: Record<string, string>;
  description_translations?: Record<string, string> | null;
  default_billing_unit?: string;
  service_scope?: string;
  period_type?: string;
  is_active?: boolean;
};

export type ProductListQuery = {
  is_active?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
};

// --------------------------------------------------------------------------- //
// Tariffs — create/edit only (GET list, POST, PATCH; NO GET /{id}, NO deactivate) //
// --------------------------------------------------------------------------- //

export type TariffRead = {
  id: number;
  product_id: number;
  billing_unit: string;
  base_price: string; // Decimal as string
  currency: string;
  volume_per_unit: number | null;
  min_units: number;
};

export type TariffListResponse = {
  items: TariffRead[];
  total: number;
};

export type TariffCreatePayload = {
  product_id: number;
  billing_unit: string;
  base_price: string;
  currency: string;
  volume_per_unit?: number | null;
  min_units?: number;
};

export type TariffUpdatePayload = {
  billing_unit?: string;
  base_price?: string;
  currency?: string;
  volume_per_unit?: number | null;
  min_units?: number;
};

export type TariffListQuery = {
  product_id?: number;
  limit?: number;
  offset?: number;
};

// --------------------------------------------------------------------------- //
// Discount rules — CRUD minus detail (GET list, POST, PATCH, POST /deactivate) //
// --------------------------------------------------------------------------- //

export type DiscountRuleRead = {
  id: number;
  product_id: number | null;
  tariff_id: number | null;
  min_units: number;
  discount_percent: number;
  valid_from: string | null; // ISO date
  valid_to: string | null;
  is_active: boolean;
};

export type DiscountRuleListResponse = {
  items: DiscountRuleRead[];
  total: number;
};

export type DiscountRuleCreatePayload = {
  product_id?: number | null;
  tariff_id?: number | null;
  min_units: number;
  discount_percent: number;
  valid_from?: string | null;
  valid_to?: string | null;
  is_active?: boolean;
};

export type DiscountRuleUpdatePayload = {
  product_id?: number | null;
  tariff_id?: number | null;
  min_units?: number;
  discount_percent?: number;
  valid_from?: string | null;
  valid_to?: string | null;
  is_active?: boolean;
};

export type DiscountRuleListQuery = {
  product_id?: number;
  tariff_id?: number;
  is_active?: boolean;
  limit?: number;
  offset?: number;
};

// --------------------------------------------------------------------------- //
// Monthly discounts — CRUD minus detail (GET list, POST, PATCH, POST /deactivate) //
// --------------------------------------------------------------------------- //

export type MonthlyDiscountRead = {
  id: number;
  product_id: number | null;
  tariff_id: number | null;
  month_start: string; // ISO date
  discount_percent: number;
  max_campaigns_total: number | null;
  max_campaigns_per_service: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MonthlyDiscountListResponse = {
  items: MonthlyDiscountRead[];
  total: number;
};

export type MonthlyDiscountCreatePayload = {
  product_id?: number | null;
  tariff_id?: number | null;
  month_start: string;
  discount_percent: number;
  max_campaigns_total?: number | null;
  max_campaigns_per_service?: number | null;
  is_active?: boolean;
};

export type MonthlyDiscountUpdatePayload = {
  product_id?: number | null;
  tariff_id?: number | null;
  month_start?: string;
  discount_percent?: number;
  max_campaigns_total?: number | null;
  max_campaigns_per_service?: number | null;
  is_active?: boolean;
};

export type MonthlyDiscountListQuery = {
  product_id?: number;
  is_active?: boolean;
  limit?: number;
  offset?: number;
};

// --------------------------------------------------------------------------- //
// Zones — create/edit + detail (GET list, GET /{id}, POST, PATCH; NO deactivate) //
// --------------------------------------------------------------------------- //

export type ZoneRead = {
  id: number;
  code: string;
  time_granularity: string;
  max_slots: number;
};

export type ZoneListResponse = {
  items: ZoneRead[];
  total: number;
};

export type ZoneCreatePayload = {
  code: string;
  time_granularity: string;
  max_slots: number;
};

// ``code`` immutable on update.
export type ZoneUpdatePayload = {
  time_granularity?: string;
  max_slots?: number;
};

export type ZoneListQuery = {
  limit?: number;
  offset?: number;
};

// --------------------------------------------------------------------------- //
// Orders — read-only (GET list, GET /{id} detail with line items) (M3b)        //
// --------------------------------------------------------------------------- //

// Decimal money columns (unit_price, discount_amount, final_price) are strings.
export type OrderItemRead = {
  id: number;
  order_id: number;
  tariff_id: number | null;
  item_type: string;
  units: number;
  unit_price: string;
  discount_percent: number;
  discount_amount: string;
  final_price: string;
  period_start: string | null; // ISO date
  period_unit: string | null;
  periods_count: number | null;
};

// Summary row (no line items). total_price is a Decimal-string.
export type OrderListItem = {
  id: number;
  service_id: number;
  status: string;
  total_price: string;
  currency: string;
  created_at: string;
  paid_at: string | null;
};

export type OrderListResponse = {
  items: OrderListItem[];
  total: number;
};

export type OrderRead = {
  id: number;
  service_id: number;
  status: string;
  total_price: string;
  currency: string;
  created_at: string;
  paid_at: string | null;
  items: OrderItemRead[];
};

export type OrderListQuery = {
  status?: string;
  service_id?: number;
  created_from?: string; // ISO datetime
  created_to?: string;
  limit?: number;
  offset?: number;
};

// --------------------------------------------------------------------------- //
// Campaigns — read (GET list, GET /{id}) + cancel (POST /{id}/cancel) (M3b)     //
// --------------------------------------------------------------------------- //

export type CampaignRead = {
  id: number;
  order_item_id: number;
  service_id: number;
  product_id: number;
  zone_id: number | null;
  status: string;
  start_date: string; // ISO date
  end_date: string;
  time_unit: string;
  slots_reserved: number;
};

export type CampaignListResponse = {
  items: CampaignRead[];
  total: number;
};

export type CampaignListQuery = {
  status?: string;
  zone_id?: number;
  service_id?: number;
  limit?: number;
  offset?: number;
};

// Optional body for the cancel mutation. The backend returns the updated
// CampaignRead (status flipped to ``canceled``).
export type CampaignCancelPayload = {
  reason?: string | null;
};
