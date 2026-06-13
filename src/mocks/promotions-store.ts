// src/mocks/promotions-store.ts
//
// In-memory mock store for the promotions CATALOG (products / tariffs /
// discount-rules / monthly-discounts / zones). Same Map-with-seed + reset
// pattern as categories-store.ts. The server actions validate/coerce every
// field before the handler reaches here, so the *Write inputs are already typed.
import type {
  CampaignListResponse,
  CampaignRead,
  DiscountRuleListResponse,
  DiscountRuleRead,
  MonthlyDiscountListResponse,
  MonthlyDiscountRead,
  OrderListResponse,
  OrderRead,
  ProductListResponse,
  ProductRead,
  TariffListResponse,
  TariffRead,
  ZoneListResponse,
  ZoneRead,
} from "@/lib/promotions/types";
import {
  buildFixtureCampaigns,
  buildFixtureDiscountRules,
  buildFixtureMonthlyDiscounts,
  buildFixtureOrders,
  buildFixtureProducts,
  buildFixtureTariffs,
  buildFixtureZones,
  toOrderListItem,
} from "./promotions-fixtures";
import { globalSingleton } from "./global-store";

const products = globalSingleton(
  "__eventupPromoProducts",
  () => new Map<number, ProductRead>(),
);
const tariffs = globalSingleton(
  "__eventupPromoTariffs",
  () => new Map<number, TariffRead>(),
);
const discountRules = globalSingleton(
  "__eventupPromoDiscountRules",
  () => new Map<number, DiscountRuleRead>(),
);
const monthlyDiscounts = globalSingleton(
  "__eventupPromoMonthlyDiscounts",
  () => new Map<number, MonthlyDiscountRead>(),
);
const zones = globalSingleton(
  "__eventupPromoZones",
  () => new Map<number, ZoneRead>(),
);
const orders = globalSingleton(
  "__eventupPromoOrders",
  () => new Map<number, OrderRead>(),
);
const campaigns = globalSingleton(
  "__eventupPromoCampaigns",
  () => new Map<number, CampaignRead>(),
);

let nextProductId = 100;
let nextTariffId = 100;
let nextDiscountRuleId = 100;
let nextMonthlyDiscountId = 100;
let nextZoneId = 100;

function ensureSeed(): void {
  if (products.size > 0) return;
  for (const p of buildFixtureProducts()) products.set(p.id, p);
  for (const t of buildFixtureTariffs()) tariffs.set(t.id, t);
  for (const r of buildFixtureDiscountRules()) discountRules.set(r.id, r);
  for (const m of buildFixtureMonthlyDiscounts())
    monthlyDiscounts.set(m.id, m);
  for (const z of buildFixtureZones()) zones.set(z.id, z);
  for (const o of buildFixtureOrders()) orders.set(o.id, o);
  for (const c of buildFixtureCampaigns()) campaigns.set(c.id, c);
}

export function resetPromotionsStore(): void {
  products.clear();
  tariffs.clear();
  discountRules.clear();
  monthlyDiscounts.clear();
  zones.clear();
  orders.clear();
  campaigns.clear();
  nextProductId = 100;
  nextTariffId = 100;
  nextDiscountRuleId = 100;
  nextMonthlyDiscountId = 100;
  nextZoneId = 100;
  ensureSeed();
}

function paginate<T>(rows: T[], limit?: number, offset?: number) {
  const lim = Math.min(Math.max(limit ?? 50, 1), 200);
  const off = Math.max(offset ?? 0, 0);
  return { items: rows.slice(off, off + lim), total: rows.length };
}

// ---- Products -------------------------------------------------------------- //

export function listProductsPage(opts: {
  is_active?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
}): ProductListResponse {
  ensureSeed();
  let rows = Array.from(products.values());
  if (opts.is_active !== undefined)
    rows = rows.filter((r) => r.is_active === opts.is_active);
  if (opts.q) {
    const q = opts.q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        Object.values(r.name_translations).some((v) =>
          v.toLowerCase().includes(q),
        ),
    );
  }
  rows.sort((a, b) => a.id - b.id);
  return paginate(rows, opts.limit, opts.offset);
}

export function getProductById(id: number): ProductRead | null {
  ensureSeed();
  return products.get(id) ?? null;
}

export type ProductWrite = Partial<Omit<ProductRead, "id">>;

export function createProductRecord(input: ProductWrite): ProductRead {
  ensureSeed();
  const id = nextProductId++;
  const record: ProductRead = {
    id,
    code: input.code ?? "",
    name_translations: input.name_translations ?? {},
    description_translations: input.description_translations ?? null,
    default_billing_unit: input.default_billing_unit ?? "month",
    service_scope: input.service_scope ?? "service",
    period_type: input.period_type ?? "calendar",
    is_active: input.is_active ?? true,
  };
  products.set(id, record);
  return record;
}

export function updateProductRecord(
  id: number,
  patch: ProductWrite,
): ProductRead | null {
  ensureSeed();
  const current = products.get(id);
  if (!current) return null;
  const updated: ProductRead = {
    ...current,
    ...(patch.name_translations !== undefined
      ? { name_translations: patch.name_translations }
      : {}),
    ...(patch.description_translations !== undefined
      ? { description_translations: patch.description_translations }
      : {}),
    ...(patch.default_billing_unit !== undefined
      ? { default_billing_unit: patch.default_billing_unit }
      : {}),
    ...(patch.service_scope !== undefined
      ? { service_scope: patch.service_scope }
      : {}),
    ...(patch.period_type !== undefined
      ? { period_type: patch.period_type }
      : {}),
    ...(patch.is_active !== undefined ? { is_active: patch.is_active } : {}),
  };
  products.set(id, updated);
  return updated;
}

export function deactivateProductRecord(id: number): ProductRead | null {
  ensureSeed();
  const current = products.get(id);
  if (!current) return null;
  const updated = { ...current, is_active: false };
  products.set(id, updated);
  return updated;
}

// ---- Tariffs --------------------------------------------------------------- //

export function listTariffsPage(opts: {
  product_id?: number;
  limit?: number;
  offset?: number;
}): TariffListResponse {
  ensureSeed();
  let rows = Array.from(tariffs.values());
  if (opts.product_id !== undefined)
    rows = rows.filter((r) => r.product_id === opts.product_id);
  rows.sort((a, b) => a.id - b.id);
  return paginate(rows, opts.limit, opts.offset);
}

export type TariffWrite = Partial<Omit<TariffRead, "id">>;

export function createTariffRecord(input: TariffWrite): TariffRead {
  ensureSeed();
  const id = nextTariffId++;
  const record: TariffRead = {
    id,
    product_id: input.product_id ?? 0,
    billing_unit: input.billing_unit ?? "month",
    base_price: input.base_price ?? "0.00",
    currency: input.currency ?? "USD",
    volume_per_unit: input.volume_per_unit ?? null,
    min_units: input.min_units ?? 1,
  };
  tariffs.set(id, record);
  return record;
}

export function updateTariffRecord(
  id: number,
  patch: TariffWrite,
): TariffRead | null {
  ensureSeed();
  const current = tariffs.get(id);
  if (!current) return null;
  const updated: TariffRead = {
    ...current,
    ...(patch.billing_unit !== undefined
      ? { billing_unit: patch.billing_unit }
      : {}),
    ...(patch.base_price !== undefined ? { base_price: patch.base_price } : {}),
    ...(patch.currency !== undefined ? { currency: patch.currency } : {}),
    ...(patch.volume_per_unit !== undefined
      ? { volume_per_unit: patch.volume_per_unit }
      : {}),
    ...(patch.min_units !== undefined ? { min_units: patch.min_units } : {}),
  };
  tariffs.set(id, updated);
  return updated;
}

// ---- Discount rules -------------------------------------------------------- //

export function listDiscountRulesPage(opts: {
  product_id?: number;
  tariff_id?: number;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}): DiscountRuleListResponse {
  ensureSeed();
  let rows = Array.from(discountRules.values());
  if (opts.product_id !== undefined)
    rows = rows.filter((r) => r.product_id === opts.product_id);
  if (opts.tariff_id !== undefined)
    rows = rows.filter((r) => r.tariff_id === opts.tariff_id);
  if (opts.is_active !== undefined)
    rows = rows.filter((r) => r.is_active === opts.is_active);
  rows.sort((a, b) => a.id - b.id);
  return paginate(rows, opts.limit, opts.offset);
}

export type DiscountRuleWrite = Partial<Omit<DiscountRuleRead, "id">>;

export function createDiscountRuleRecord(
  input: DiscountRuleWrite,
): DiscountRuleRead {
  ensureSeed();
  const id = nextDiscountRuleId++;
  const record: DiscountRuleRead = {
    id,
    product_id: input.product_id ?? null,
    tariff_id: input.tariff_id ?? null,
    min_units: input.min_units ?? 1,
    discount_percent: input.discount_percent ?? 0,
    valid_from: input.valid_from ?? null,
    valid_to: input.valid_to ?? null,
    is_active: input.is_active ?? true,
  };
  discountRules.set(id, record);
  return record;
}

export function updateDiscountRuleRecord(
  id: number,
  patch: DiscountRuleWrite,
): DiscountRuleRead | null {
  ensureSeed();
  const current = discountRules.get(id);
  if (!current) return null;
  const updated: DiscountRuleRead = {
    ...current,
    ...(patch.product_id !== undefined
      ? { product_id: patch.product_id }
      : {}),
    ...(patch.tariff_id !== undefined ? { tariff_id: patch.tariff_id } : {}),
    ...(patch.min_units !== undefined ? { min_units: patch.min_units } : {}),
    ...(patch.discount_percent !== undefined
      ? { discount_percent: patch.discount_percent }
      : {}),
    ...(patch.valid_from !== undefined
      ? { valid_from: patch.valid_from }
      : {}),
    ...(patch.valid_to !== undefined ? { valid_to: patch.valid_to } : {}),
    ...(patch.is_active !== undefined ? { is_active: patch.is_active } : {}),
  };
  discountRules.set(id, updated);
  return updated;
}

export function deactivateDiscountRuleRecord(
  id: number,
): DiscountRuleRead | null {
  ensureSeed();
  const current = discountRules.get(id);
  if (!current) return null;
  const updated = { ...current, is_active: false };
  discountRules.set(id, updated);
  return updated;
}

// ---- Monthly discounts ----------------------------------------------------- //

export function listMonthlyDiscountsPage(opts: {
  product_id?: number;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}): MonthlyDiscountListResponse {
  ensureSeed();
  let rows = Array.from(monthlyDiscounts.values());
  if (opts.product_id !== undefined)
    rows = rows.filter((r) => r.product_id === opts.product_id);
  if (opts.is_active !== undefined)
    rows = rows.filter((r) => r.is_active === opts.is_active);
  rows.sort((a, b) => a.id - b.id);
  return paginate(rows, opts.limit, opts.offset);
}

export type MonthlyDiscountWrite = Partial<
  Omit<MonthlyDiscountRead, "id" | "created_at" | "updated_at">
>;

export function createMonthlyDiscountRecord(
  input: MonthlyDiscountWrite,
): MonthlyDiscountRead {
  ensureSeed();
  const id = nextMonthlyDiscountId++;
  const now = new Date(0).toISOString();
  const record: MonthlyDiscountRead = {
    id,
    product_id: input.product_id ?? null,
    tariff_id: input.tariff_id ?? null,
    month_start: input.month_start ?? "2026-01-01",
    discount_percent: input.discount_percent ?? 0,
    max_campaigns_total: input.max_campaigns_total ?? null,
    max_campaigns_per_service: input.max_campaigns_per_service ?? null,
    is_active: input.is_active ?? true,
    created_at: now,
    updated_at: now,
  };
  monthlyDiscounts.set(id, record);
  return record;
}

export function updateMonthlyDiscountRecord(
  id: number,
  patch: MonthlyDiscountWrite,
): MonthlyDiscountRead | null {
  ensureSeed();
  const current = monthlyDiscounts.get(id);
  if (!current) return null;
  const updated: MonthlyDiscountRead = {
    ...current,
    ...(patch.product_id !== undefined
      ? { product_id: patch.product_id }
      : {}),
    ...(patch.tariff_id !== undefined ? { tariff_id: patch.tariff_id } : {}),
    ...(patch.month_start !== undefined
      ? { month_start: patch.month_start }
      : {}),
    ...(patch.discount_percent !== undefined
      ? { discount_percent: patch.discount_percent }
      : {}),
    ...(patch.max_campaigns_total !== undefined
      ? { max_campaigns_total: patch.max_campaigns_total }
      : {}),
    ...(patch.max_campaigns_per_service !== undefined
      ? { max_campaigns_per_service: patch.max_campaigns_per_service }
      : {}),
    ...(patch.is_active !== undefined ? { is_active: patch.is_active } : {}),
    updated_at: new Date(1).toISOString(),
  };
  monthlyDiscounts.set(id, updated);
  return updated;
}

export function deactivateMonthlyDiscountRecord(
  id: number,
): MonthlyDiscountRead | null {
  ensureSeed();
  const current = monthlyDiscounts.get(id);
  if (!current) return null;
  const updated = {
    ...current,
    is_active: false,
    updated_at: new Date(1).toISOString(),
  };
  monthlyDiscounts.set(id, updated);
  return updated;
}

// ---- Zones ----------------------------------------------------------------- //

export function listZonesPage(opts: {
  limit?: number;
  offset?: number;
}): ZoneListResponse {
  ensureSeed();
  const rows = Array.from(zones.values()).sort((a, b) => a.id - b.id);
  return paginate(rows, opts.limit, opts.offset);
}

export function getZoneById(id: number): ZoneRead | null {
  ensureSeed();
  return zones.get(id) ?? null;
}

export type ZoneWrite = Partial<Omit<ZoneRead, "id">>;

export function createZoneRecord(input: ZoneWrite): ZoneRead {
  ensureSeed();
  const id = nextZoneId++;
  const record: ZoneRead = {
    id,
    code: input.code ?? "",
    time_granularity: input.time_granularity ?? "day",
    max_slots: input.max_slots ?? 0,
  };
  zones.set(id, record);
  return record;
}

export function updateZoneRecord(
  id: number,
  patch: ZoneWrite,
): ZoneRead | null {
  ensureSeed();
  const current = zones.get(id);
  if (!current) return null;
  const updated: ZoneRead = {
    ...current,
    ...(patch.time_granularity !== undefined
      ? { time_granularity: patch.time_granularity }
      : {}),
    ...(patch.max_slots !== undefined ? { max_slots: patch.max_slots } : {}),
  };
  zones.set(id, updated);
  return updated;
}

// ---- Orders (read-only) ---------------------------------------------------- //

export function listOrdersPage(opts: {
  status?: string;
  service_id?: number;
  created_from?: string;
  created_to?: string;
  limit?: number;
  offset?: number;
}): OrderListResponse {
  ensureSeed();
  let rows = Array.from(orders.values());
  if (opts.status !== undefined)
    rows = rows.filter((r) => r.status === opts.status);
  if (opts.service_id !== undefined)
    rows = rows.filter((r) => r.service_id === opts.service_id);
  if (opts.created_from !== undefined)
    rows = rows.filter((r) => r.created_at >= opts.created_from!);
  if (opts.created_to !== undefined)
    rows = rows.filter((r) => r.created_at <= opts.created_to!);
  rows.sort((a, b) => a.id - b.id);
  const page = paginate(rows, opts.limit, opts.offset);
  return { items: page.items.map(toOrderListItem), total: page.total };
}

export function getOrderById(id: number): OrderRead | null {
  ensureSeed();
  return orders.get(id) ?? null;
}

// ---- Campaigns (read + cancel) --------------------------------------------- //

export function listCampaignsPage(opts: {
  status?: string;
  zone_id?: number;
  service_id?: number;
  limit?: number;
  offset?: number;
}): CampaignListResponse {
  ensureSeed();
  let rows = Array.from(campaigns.values());
  if (opts.status !== undefined)
    rows = rows.filter((r) => r.status === opts.status);
  if (opts.zone_id !== undefined)
    rows = rows.filter((r) => r.zone_id === opts.zone_id);
  if (opts.service_id !== undefined)
    rows = rows.filter((r) => r.service_id === opts.service_id);
  rows.sort((a, b) => a.id - b.id);
  return paginate(rows, opts.limit, opts.offset);
}

export function getCampaignById(id: number): CampaignRead | null {
  ensureSeed();
  return campaigns.get(id) ?? null;
}

// Cancel mirrors the backend service: missing → "not_found"; already terminal
// (canceled / expired) or otherwise non-cancelable → "conflict" (a clean 4xx,
// exercises the error path); otherwise status flips to ``canceled`` and the
// updated row is returned.
//
// Campaign #3 is seeded active but flagged non-cancelable here so the cancel
// error path can be exercised in-UI (an active row still renders a Cancel
// button; the backend then rejects it) — see promotions-fixtures.
const NON_CANCELABLE_CAMPAIGN_IDS = new Set<number>([3]);

export type CancelCampaignResult =
  | { kind: "ok"; campaign: CampaignRead }
  | { kind: "not_found" }
  | { kind: "conflict"; reason: string };

export function cancelCampaignRecord(id: number): CancelCampaignResult {
  ensureSeed();
  const current = campaigns.get(id);
  if (!current) return { kind: "not_found" };
  if (current.status === "canceled" || current.status === "expired")
    return {
      kind: "conflict",
      reason: `Campaign ${id} is already ${current.status} and cannot be canceled`,
    };
  if (NON_CANCELABLE_CAMPAIGN_IDS.has(id))
    return {
      kind: "conflict",
      reason: `Campaign ${id} has already been settled and cannot be canceled`,
    };
  const updated: CampaignRead = { ...current, status: "canceled" };
  campaigns.set(id, updated);
  return { kind: "ok", campaign: updated };
}
