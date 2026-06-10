// src/lib/promotions/api.ts
//
// Typed client for the M3 promotions CATALOG (products / tariffs /
// discount-rules / monthly-discounts / zones). Reads are GETs with query params
// (mirrors providers/api.ts, not the POST /list of categories). Writes pass
// `redirectOn401:false` so Server Actions surface a structured error to the
// form instead of redirecting. Only the methods the backend views expose per
// entity are wired here — see per-entity notes.
import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  CampaignCancelPayload,
  CampaignListQuery,
  CampaignListResponse,
  CampaignRead,
  DiscountRuleCreatePayload,
  DiscountRuleListQuery,
  DiscountRuleListResponse,
  DiscountRuleRead,
  DiscountRuleUpdatePayload,
  MonthlyDiscountCreatePayload,
  MonthlyDiscountListQuery,
  MonthlyDiscountListResponse,
  MonthlyDiscountRead,
  MonthlyDiscountUpdatePayload,
  OrderListQuery,
  OrderListResponse,
  OrderRead,
  ProductCreatePayload,
  ProductListQuery,
  ProductListResponse,
  ProductRead,
  ProductUpdatePayload,
  TariffCreatePayload,
  TariffListQuery,
  TariffListResponse,
  TariffRead,
  TariffUpdatePayload,
  ZoneCreatePayload,
  ZoneListQuery,
  ZoneListResponse,
  ZoneRead,
  ZoneUpdatePayload,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace/promotions";

function appendBool(params: URLSearchParams, key: string, v: boolean | undefined) {
  if (v !== undefined) params.set(key, v ? "true" : "false");
}
function appendNum(params: URLSearchParams, key: string, v: number | undefined) {
  if (v !== undefined) params.set(key, String(v));
}
function withQs(path: string, params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

// --------------------------------------------------------------------------- //
// Products — full CRUD                                                         //
// --------------------------------------------------------------------------- //

export function listProducts(
  query: ProductListQuery = {},
): Promise<ApiFetchResult<ProductListResponse>> {
  const params = new URLSearchParams();
  appendBool(params, "is_active", query.is_active);
  if (query.q) params.set("q", query.q);
  appendNum(params, "limit", query.limit);
  appendNum(params, "offset", query.offset);
  return apiFetch<ProductListResponse>(withQs(`${BASE}/products`, params));
}

export function getProduct(
  id: number,
): Promise<ApiFetchResult<ProductRead>> {
  return apiFetch<ProductRead>(`${BASE}/products/${id}`);
}

export function createProduct(
  payload: ProductCreatePayload,
): Promise<ApiFetchResult<ProductRead>> {
  return apiFetch<ProductRead>(`${BASE}/products`, {
    method: "POST",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function updateProduct(
  id: number,
  payload: ProductUpdatePayload,
): Promise<ApiFetchResult<ProductRead>> {
  return apiFetch<ProductRead>(`${BASE}/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function deactivateProduct(
  id: number,
): Promise<ApiFetchResult<ProductRead>> {
  return apiFetch<ProductRead>(`${BASE}/products/${id}/deactivate`, {
    method: "POST",
    redirectOn401: false,
  });
}

// --------------------------------------------------------------------------- //
// Tariffs — list + create + update (no GET /{id}, no deactivate)              //
// --------------------------------------------------------------------------- //

export function listTariffs(
  query: TariffListQuery = {},
): Promise<ApiFetchResult<TariffListResponse>> {
  const params = new URLSearchParams();
  appendNum(params, "product_id", query.product_id);
  appendNum(params, "limit", query.limit);
  appendNum(params, "offset", query.offset);
  return apiFetch<TariffListResponse>(withQs(`${BASE}/tariffs`, params));
}

export function createTariff(
  payload: TariffCreatePayload,
): Promise<ApiFetchResult<TariffRead>> {
  return apiFetch<TariffRead>(`${BASE}/tariffs`, {
    method: "POST",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function updateTariff(
  id: number,
  payload: TariffUpdatePayload,
): Promise<ApiFetchResult<TariffRead>> {
  return apiFetch<TariffRead>(`${BASE}/tariffs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

// --------------------------------------------------------------------------- //
// Discount rules — list + create + update + deactivate (no GET /{id})         //
// --------------------------------------------------------------------------- //

export function listDiscountRules(
  query: DiscountRuleListQuery = {},
): Promise<ApiFetchResult<DiscountRuleListResponse>> {
  const params = new URLSearchParams();
  appendNum(params, "product_id", query.product_id);
  appendNum(params, "tariff_id", query.tariff_id);
  appendBool(params, "is_active", query.is_active);
  appendNum(params, "limit", query.limit);
  appendNum(params, "offset", query.offset);
  return apiFetch<DiscountRuleListResponse>(
    withQs(`${BASE}/discount-rules`, params),
  );
}

export function createDiscountRule(
  payload: DiscountRuleCreatePayload,
): Promise<ApiFetchResult<DiscountRuleRead>> {
  return apiFetch<DiscountRuleRead>(`${BASE}/discount-rules`, {
    method: "POST",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function updateDiscountRule(
  id: number,
  payload: DiscountRuleUpdatePayload,
): Promise<ApiFetchResult<DiscountRuleRead>> {
  return apiFetch<DiscountRuleRead>(`${BASE}/discount-rules/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function deactivateDiscountRule(
  id: number,
): Promise<ApiFetchResult<DiscountRuleRead>> {
  return apiFetch<DiscountRuleRead>(`${BASE}/discount-rules/${id}/deactivate`, {
    method: "POST",
    redirectOn401: false,
  });
}

// --------------------------------------------------------------------------- //
// Monthly discounts — list + create + update + deactivate (no GET /{id})      //
// --------------------------------------------------------------------------- //

export function listMonthlyDiscounts(
  query: MonthlyDiscountListQuery = {},
): Promise<ApiFetchResult<MonthlyDiscountListResponse>> {
  const params = new URLSearchParams();
  appendNum(params, "product_id", query.product_id);
  appendBool(params, "is_active", query.is_active);
  appendNum(params, "limit", query.limit);
  appendNum(params, "offset", query.offset);
  return apiFetch<MonthlyDiscountListResponse>(
    withQs(`${BASE}/monthly-discounts`, params),
  );
}

export function createMonthlyDiscount(
  payload: MonthlyDiscountCreatePayload,
): Promise<ApiFetchResult<MonthlyDiscountRead>> {
  return apiFetch<MonthlyDiscountRead>(`${BASE}/monthly-discounts`, {
    method: "POST",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function updateMonthlyDiscount(
  id: number,
  payload: MonthlyDiscountUpdatePayload,
): Promise<ApiFetchResult<MonthlyDiscountRead>> {
  return apiFetch<MonthlyDiscountRead>(`${BASE}/monthly-discounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function deactivateMonthlyDiscount(
  id: number,
): Promise<ApiFetchResult<MonthlyDiscountRead>> {
  return apiFetch<MonthlyDiscountRead>(
    `${BASE}/monthly-discounts/${id}/deactivate`,
    { method: "POST", redirectOn401: false },
  );
}

// --------------------------------------------------------------------------- //
// Zones — list + detail + create + update (no deactivate)                     //
// --------------------------------------------------------------------------- //

export function listZones(
  query: ZoneListQuery = {},
): Promise<ApiFetchResult<ZoneListResponse>> {
  const params = new URLSearchParams();
  appendNum(params, "limit", query.limit);
  appendNum(params, "offset", query.offset);
  return apiFetch<ZoneListResponse>(withQs(`${BASE}/zones`, params));
}

export function getZone(id: number): Promise<ApiFetchResult<ZoneRead>> {
  return apiFetch<ZoneRead>(`${BASE}/zones/${id}`);
}

export function createZone(
  payload: ZoneCreatePayload,
): Promise<ApiFetchResult<ZoneRead>> {
  return apiFetch<ZoneRead>(`${BASE}/zones`, {
    method: "POST",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function updateZone(
  id: number,
  payload: ZoneUpdatePayload,
): Promise<ApiFetchResult<ZoneRead>> {
  return apiFetch<ZoneRead>(`${BASE}/zones/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

function appendStr(params: URLSearchParams, key: string, v: string | undefined) {
  if (v !== undefined && v !== "") params.set(key, v);
}

// --------------------------------------------------------------------------- //
// Orders — read-only (list + detail). No writes.                              //
// --------------------------------------------------------------------------- //

export function listOrders(
  query: OrderListQuery = {},
): Promise<ApiFetchResult<OrderListResponse>> {
  const params = new URLSearchParams();
  appendStr(params, "status", query.status);
  appendNum(params, "service_id", query.service_id);
  appendStr(params, "created_from", query.created_from);
  appendStr(params, "created_to", query.created_to);
  appendNum(params, "limit", query.limit);
  appendNum(params, "offset", query.offset);
  return apiFetch<OrderListResponse>(withQs(`${BASE}/orders`, params));
}

export function getOrder(id: number): Promise<ApiFetchResult<OrderRead>> {
  return apiFetch<OrderRead>(`${BASE}/orders/${id}`);
}

// --------------------------------------------------------------------------- //
// Campaigns — read (list + detail) + cancel (mutating, audited backend-side).  //
// --------------------------------------------------------------------------- //

export function listCampaigns(
  query: CampaignListQuery = {},
): Promise<ApiFetchResult<CampaignListResponse>> {
  const params = new URLSearchParams();
  appendStr(params, "status", query.status);
  appendNum(params, "zone_id", query.zone_id);
  appendNum(params, "service_id", query.service_id);
  appendNum(params, "limit", query.limit);
  appendNum(params, "offset", query.offset);
  return apiFetch<CampaignListResponse>(withQs(`${BASE}/campaigns`, params));
}

export function getCampaign(
  id: number,
): Promise<ApiFetchResult<CampaignRead>> {
  return apiFetch<CampaignRead>(`${BASE}/campaigns/${id}`);
}

// POST /{id}/cancel — body is optional ({reason}); returns the updated
// CampaignRead. redirectOn401:false so the Server Action surfaces a structured
// error to the table instead of redirecting.
export function cancelCampaign(
  id: number,
  payload: CampaignCancelPayload = {},
): Promise<ApiFetchResult<CampaignRead>> {
  return apiFetch<CampaignRead>(`${BASE}/campaigns/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}
