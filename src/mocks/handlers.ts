import { http, HttpResponse } from "msw";
import { decodeJwt } from "jose";
import { buildApiUrl } from "@/lib/api-config";
import {
  isServiceStatus,
  type ServiceListItem,
  type ServiceModerationResponse,
  type ServiceStatus,
} from "@/lib/services/types";
import type {
  ProviderListItem,
  ProviderModerationResponse,
} from "@/lib/providers/types";
import { CONFLICT_SERVICE_ID } from "./fixtures";
import { CONFLICT_PROVIDER_ID } from "./providers-fixtures";
import { getAll, getById, patchServiceFields, setStatus } from "./store";
import {
  getAllProviders,
  getProviderById,
  patchProviderFields,
  setProviderStatus,
} from "./providers-store";
import type { ProviderFieldsPatch } from "@/lib/providers/types";
import type { ServiceFieldsPatch } from "@/lib/services/types";
import type { ServiceDetail } from "@/lib/services/types";
import type { ProviderDetail } from "@/lib/providers/types";
import {
  CONFLICT_OFFER_ID,
  makeDispatchRunLogItem,
  makeDlqItem,
  makeProviderHealthItem,
  makeServiceHealthItem,
  makeSlaSummaryItem,
} from "./offers-fixtures";
import { getAllOffers, getOffer, setOfferStatus } from "./offers-store";
import { isOfferStatus, type OfferStatus, type QueueStatus } from "@/lib/offers/types";
import { isAdminRole, type AdminDetail, type AdminListItem } from "@/lib/admins/types";
import {
  createInvitationRecord,
  deleteInvitationRecord,
  getAdminById,
  getAllAdmins,
  getAllInvitations,
  grantScopeRecord,
  revokeScopeRecord,
  updateAdminRecord,
} from "./admins-store";
import {
  createCategoryRecord,
  deleteCategoryRecord,
  getCategoryById,
  hasChildren,
  listCategoriesPage,
  updateCategoryRecord,
  type CategoryWrite,
} from "./categories-store";
import {
  createPromoCodeRecord,
  deactivatePromoCodeRecord,
  getPromoCodeById,
  listPromoCodesPage,
  updatePromoCodeRecord,
  type PromoCodePatch,
  type PromoCodeWrite,
} from "./promo-codes-store";
import type { TargetingRuleTree } from "@/lib/promo-codes/types";
import {
  createAttributeDefinitionRecord,
  deleteAttributeDefinitionRecord,
  getAttributeDefinitionByKey,
  listAttributeDefinitionsPage,
  updateAttributeDefinitionRecord,
  type AttributeDefinitionWrite,
} from "./attribute-definitions-store";
import type { AttributeSchema } from "@/lib/categories/types";
import {
  DEFAULT_FROM,
  DEFAULT_TO,
  buildListingDetail,
  buildSummary,
  buildTopListings,
} from "./traffic-fixtures";
import {
  cancelCampaignRecord,
  createDiscountRuleRecord,
  createMonthlyDiscountRecord,
  createProductRecord,
  createTariffRecord,
  createZoneRecord,
  deactivateDiscountRuleRecord,
  deactivateMonthlyDiscountRecord,
  deactivateProductRecord,
  getCampaignById,
  getOrderById,
  getProductById,
  getZoneById,
  listCampaignsPage,
  listDiscountRulesPage,
  listMonthlyDiscountsPage,
  listOrdersPage,
  listProductsPage,
  listTariffsPage,
  listZonesPage,
  updateDiscountRuleRecord,
  updateMonthlyDiscountRecord,
  updateProductRecord,
  updateTariffRecord,
  updateZoneRecord,
  type DiscountRuleWrite,
  type MonthlyDiscountWrite,
  type ProductWrite,
  type TariffWrite,
  type ZoneWrite,
} from "./promotions-store";
import {
  activateFormulaConfigRecord,
  clearServiceOverrideRecord,
  getAnomalyById,
  getFormulaConfigById,
  getProviderMetricById,
  getServiceMetricById,
  listAnomaliesPage,
  listFormulaConfigsPage,
  listProviderMetricsPage,
  listServiceMetricsPage,
  reviewAnomalyRecord,
  rollbackFormulaConfigRecord,
  setServiceOverrideRecord,
  type OverrideWrite,
} from "./quality-store";
import { getPaymentById, listPaymentsPage } from "./payments-store";
import { getAuditEventById, listAuditEventsPage } from "./audit-store";

const BASE = buildApiUrl("/eventup-admin/v1/marketplace/services");
const PROVIDERS_BASE = buildApiUrl("/eventup-admin/v1/marketplace/providers");
const OFFERS_BASE = buildApiUrl("/eventup-admin/v1/marketplace/offers");
const ADMINS_BASE = buildApiUrl("/eventup-admin/v1/admins");
const CATEGORIES_BASE = buildApiUrl(
  "/eventup-admin/v1/marketplace/categories",
);
const PROMO_CODES_BASE = buildApiUrl(
  "/eventup-admin/v1/marketplace/promo-codes",
);
const ANALYTICS_BASE = buildApiUrl(
  "/eventup-admin/v1/marketplace/analytics",
);
const PROMOTIONS_BASE = buildApiUrl(
  "/eventup-admin/v1/marketplace/promotions",
);
const QUALITY_BASE = buildApiUrl(
  "/eventup-admin/v1/marketplace/quality",
);
const ATTRIBUTE_DEFINITIONS_BASE = buildApiUrl(
  "/eventup-admin/v1/marketplace/attribute-definitions",
);
const PAYMENTS_BASE = buildApiUrl(
  "/eventup-admin/v1/marketplace/payments",
);
const AUDIT_BASE = buildApiUrl("/eventup-admin/v1/audit");

const ANALYTICS_TYPES = new Set(["service", "offer"]);

function toAdminListItem(a: AdminDetail): AdminListItem {
  return {
    id: a.id,
    email: a.email,
    role: a.role,
    is_active: a.is_active,
    display_name: a.display_name,
    last_login_at: a.last_login_at,
  };
}

// The operator's id rides in the bearer token's `sub` (mock JWTs mirror the
// seeded admin ids — see src/lib/auth/mock.ts), so the PATCH handler can
// reproduce the backend's self-referential guards.
function operatorSub(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const sub = decodeJwt(auth.slice(7)).sub;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}

// The mock access token embeds the operator role directly as a `role` claim
// (see src/lib/auth/mock.ts issueMockTokens). Read it straight from the bearer
// to reproduce the backend's role-gated delete.
function operatorRole(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const role = decodeJwt(auth.slice(7)).role;
    return typeof role === "string" ? role : null;
  } catch {
    return null;
  }
}

// Normalize an untyped JSON body into the store's CategoryWrite shape. The
// server action already validates/coerces every field before it reaches the
// mock, so here we only pick the known keys (omitting any unexpected ones) to
// keep the store typed instead of escaping through `as never`.
function toCategoryWrite(body: Record<string, unknown>): CategoryWrite {
  const out: CategoryWrite = {};
  if (typeof body.name === "string") out.name = body.name;
  if (typeof body.slug === "string") out.slug = body.slug;
  if (typeof body.icon === "string" || body.icon === null)
    out.icon = body.icon as string | null;
  if (typeof body.description === "string" || body.description === null)
    out.description = body.description as string | null;
  if (typeof body.sort_order === "number") out.sort_order = body.sort_order;
  if (typeof body.parent_id === "number" || body.parent_id === null)
    out.parent_id = body.parent_id as number | null;
  if (typeof body.publication_currency === "string" || body.publication_currency === null)
    out.publication_currency = body.publication_currency as string | null;
  if (typeof body.publication_price_monthly === "string" || body.publication_price_monthly === null)
    out.publication_price_monthly = body.publication_price_monthly as string | null;
  if (
    typeof body.publication_price_monthly_discounted === "string" ||
    body.publication_price_monthly_discounted === null
  )
    out.publication_price_monthly_discounted =
      body.publication_price_monthly_discounted as string | null;
  if (
    body.attribute_schema === null ||
    (typeof body.attribute_schema === "object" && body.attribute_schema !== null)
  )
    out.attribute_schema = body.attribute_schema as AttributeSchema | null;
  if (typeof body.name_translations === "object" && body.name_translations !== null)
    out.name_translations = body.name_translations as Record<string, string>;
  if (
    typeof body.description_translations === "object" &&
    body.description_translations !== null
  )
    out.description_translations = body.description_translations as Record<
      string,
      string
    >;
  return out;
}

// Normalize an untyped promo-code create body into the store's write shape.
// The server action validates/coerces every field upstream; here we pick known
// keys so the store stays typed. Money/Decimal arrive as strings.
function toPromoCodeWrite(body: Record<string, unknown>): PromoCodeWrite {
  const out: PromoCodeWrite = {};
  if (typeof body.code === "string") out.code = body.code;
  if (typeof body.discount_type === "string")
    out.discount_type = body.discount_type;
  if (typeof body.discount_value === "string")
    out.discount_value = body.discount_value;
  if (typeof body.currency === "string" || body.currency === null)
    out.currency = body.currency as string | null;
  if (typeof body.max_uses === "number" || body.max_uses === null)
    out.max_uses = body.max_uses as number | null;
  if (
    typeof body.min_order_amount_minor === "number" ||
    body.min_order_amount_minor === null
  )
    out.min_order_amount_minor = body.min_order_amount_minor as number | null;
  if (Array.isArray(body.allowed_item_types) || body.allowed_item_types === null)
    out.allowed_item_types = body.allowed_item_types as string[] | null;
  if (
    Array.isArray(body.allowed_periods_count) ||
    body.allowed_periods_count === null
  )
    out.allowed_periods_count = body.allowed_periods_count as number[] | null;
  if (typeof body.valid_from === "string" || body.valid_from === null)
    out.valid_from = body.valid_from as string | null;
  if (typeof body.valid_until === "string" || body.valid_until === null)
    out.valid_until = body.valid_until as string | null;
  if (typeof body.is_active === "boolean") out.is_active = body.is_active;
  if (typeof body.stripe_coupon_id === "string" || body.stripe_coupon_id === null)
    out.stripe_coupon_id = body.stripe_coupon_id as string | null;
  if (
    body.targeting_rules === null ||
    (typeof body.targeting_rules === "object" && body.targeting_rules !== null)
  )
    out.targeting_rules = body.targeting_rules as TargetingRuleTree | null;
  return out;
}

// PATCH body coercion — mutable fields only.
function toPromoCodePatch(body: Record<string, unknown>): PromoCodePatch {
  const out: PromoCodePatch = {};
  if (typeof body.is_active === "boolean" || body.is_active === null)
    out.is_active = body.is_active as boolean | null;
  if (typeof body.valid_until === "string" || body.valid_until === null)
    out.valid_until = body.valid_until as string | null;
  if (typeof body.max_uses === "number" || body.max_uses === null)
    out.max_uses = body.max_uses as number | null;
  if (
    body.targeting_rules === null ||
    (typeof body.targeting_rules === "object" && body.targeting_rules !== null)
  )
    out.targeting_rules = body.targeting_rules as TargetingRuleTree | null;
  return out;
}

// --- Promotions catalog body coercion ------------------------------------- //
// The server actions already validate/coerce every field; here we only pick the
// known keys per entity so the store stays typed (no `as never`).
function str(body: Record<string, unknown>, key: string): string | undefined {
  return typeof body[key] === "string" ? (body[key] as string) : undefined;
}
function num(body: Record<string, unknown>, key: string): number | undefined {
  return typeof body[key] === "number" ? (body[key] as number) : undefined;
}
function numOrNull(
  body: Record<string, unknown>,
  key: string,
): number | null | undefined {
  if (body[key] === null) return null;
  return typeof body[key] === "number" ? (body[key] as number) : undefined;
}
function bool(body: Record<string, unknown>, key: string): boolean | undefined {
  return typeof body[key] === "boolean" ? (body[key] as boolean) : undefined;
}
function dateOrNull(
  body: Record<string, unknown>,
  key: string,
): string | null | undefined {
  if (body[key] === null) return null;
  return typeof body[key] === "string" ? (body[key] as string) : undefined;
}
function translations(
  body: Record<string, unknown>,
  key: string,
): Record<string, string> | undefined {
  const v = body[key];
  return typeof v === "object" && v !== null
    ? (v as Record<string, string>)
    : undefined;
}

function toProductWrite(body: Record<string, unknown>): ProductWrite {
  const out: ProductWrite = {};
  const code = str(body, "code");
  if (code !== undefined) out.code = code;
  const nt = translations(body, "name_translations");
  if (nt !== undefined) out.name_translations = nt;
  if (body.description_translations === null)
    out.description_translations = null;
  else {
    const dt = translations(body, "description_translations");
    if (dt !== undefined) out.description_translations = dt;
  }
  const dbu = str(body, "default_billing_unit");
  if (dbu !== undefined) out.default_billing_unit = dbu;
  const ss = str(body, "service_scope");
  if (ss !== undefined) out.service_scope = ss;
  const pt = str(body, "period_type");
  if (pt !== undefined) out.period_type = pt;
  const ia = bool(body, "is_active");
  if (ia !== undefined) out.is_active = ia;
  return out;
}

function toTariffWrite(body: Record<string, unknown>): TariffWrite {
  const out: TariffWrite = {};
  const pid = num(body, "product_id");
  if (pid !== undefined) out.product_id = pid;
  const bu = str(body, "billing_unit");
  if (bu !== undefined) out.billing_unit = bu;
  const bp = str(body, "base_price");
  if (bp !== undefined) out.base_price = bp;
  const cur = str(body, "currency");
  if (cur !== undefined) out.currency = cur;
  const vpu = numOrNull(body, "volume_per_unit");
  if (vpu !== undefined) out.volume_per_unit = vpu;
  const mu = num(body, "min_units");
  if (mu !== undefined) out.min_units = mu;
  return out;
}

function toDiscountRuleWrite(
  body: Record<string, unknown>,
): DiscountRuleWrite {
  const out: DiscountRuleWrite = {};
  const pid = numOrNull(body, "product_id");
  if (pid !== undefined) out.product_id = pid;
  const tid = numOrNull(body, "tariff_id");
  if (tid !== undefined) out.tariff_id = tid;
  const mu = num(body, "min_units");
  if (mu !== undefined) out.min_units = mu;
  const dp = num(body, "discount_percent");
  if (dp !== undefined) out.discount_percent = dp;
  const vf = dateOrNull(body, "valid_from");
  if (vf !== undefined) out.valid_from = vf;
  const vt = dateOrNull(body, "valid_to");
  if (vt !== undefined) out.valid_to = vt;
  const ia = bool(body, "is_active");
  if (ia !== undefined) out.is_active = ia;
  return out;
}

function toMonthlyDiscountWrite(
  body: Record<string, unknown>,
): MonthlyDiscountWrite {
  const out: MonthlyDiscountWrite = {};
  const pid = numOrNull(body, "product_id");
  if (pid !== undefined) out.product_id = pid;
  const tid = numOrNull(body, "tariff_id");
  if (tid !== undefined) out.tariff_id = tid;
  const ms = str(body, "month_start");
  if (ms !== undefined) out.month_start = ms;
  const dp = num(body, "discount_percent");
  if (dp !== undefined) out.discount_percent = dp;
  const mct = numOrNull(body, "max_campaigns_total");
  if (mct !== undefined) out.max_campaigns_total = mct;
  const mcps = numOrNull(body, "max_campaigns_per_service");
  if (mcps !== undefined) out.max_campaigns_per_service = mcps;
  const ia = bool(body, "is_active");
  if (ia !== undefined) out.is_active = ia;
  return out;
}

// Quality manual-override body coercion. The server action validates/coerces
// every field before the mock sees it; here we only pick the known keys.
function toOverrideWrite(body: Record<string, unknown>): OverrideWrite | null {
  const coefficient = num(body, "coefficient");
  const reason = str(body, "reason");
  if (coefficient === undefined || reason === undefined) return null;
  const out: OverrideWrite = { coefficient, reason };
  if (body.until === null) out.until = null;
  else {
    const until = str(body, "until");
    if (until !== undefined) out.until = until;
  }
  return out;
}

// Quality writes gate ADMIN_MARKETPLACE_RANKING_MANAGE = SUPERADMIN-only.
// Returns a 403 (generic message + specific reason in meta.original_detail,
// matching map_marketplace_exception) for any non-SUPERADMIN operator; null when
// the operator is allowed through.
function forbidNonSuperadminQuality(request: Request): Response | null {
  if (operatorRole(request) === "SUPERADMIN") return null;
  return HttpResponse.json(
    {
      error: {
        message: "forbidden",
        meta: {
          original_detail: "Requires the marketplace ranking-manage permission",
        },
      },
    },
    { status: 403 },
  );
}

function toZoneWrite(body: Record<string, unknown>): ZoneWrite {
  const out: ZoneWrite = {};
  const code = str(body, "code");
  if (code !== undefined) out.code = code;
  const tg = str(body, "time_granularity");
  if (tg !== undefined) out.time_granularity = tg;
  const ms = num(body, "max_slots");
  if (ms !== undefined) out.max_slots = ms;
  return out;
}

function queryBool(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  return value === "true";
}
function queryNum(value: string | null): number | undefined {
  if (value === null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}
function queryStr(value: string | null): string | undefined {
  return value === null || value === "" ? undefined : value;
}

// Pick known attribute-definition keys from an untyped JSON body. The server
// action already validated/coerced each field; here we only keep typed keys.
function toAttributeDefinitionWrite(
  body: Record<string, unknown>,
): AttributeDefinitionWrite {
  const out: AttributeDefinitionWrite = {};
  if (typeof body.key === "string") out.key = body.key;
  if (typeof body.descriptor === "object" && body.descriptor !== null)
    out.descriptor = body.descriptor as Record<string, unknown>;
  if (typeof body.group_name === "string" || body.group_name === null)
    out.group_name = body.group_name as string | null;
  if (typeof body.sort_order === "number") out.sort_order = body.sort_order;
  if (typeof body.is_active === "boolean") out.is_active = body.is_active;
  if (typeof body.is_system === "boolean") out.is_system = body.is_system;
  return out;
}

function activeSuperadminCount(): number {
  return getAllAdmins().filter((a) => a.role === "SUPERADMIN" && a.is_active)
    .length;
}

// Mirrors the real backend's map_marketplace_exception (eventup-backend #100):
// error.message stays the localised generic string while the specific reason
// rides in error.meta.original_detail, which the FE (readError in lib/api)
// reads first.
function adminValidationError(originalDetail: string) {
  return HttpResponse.json(
    {
      error: {
        message: "Request cannot be processed",
        meta: { original_detail: originalDetail },
      },
    },
    { status: 400 },
  );
}

function toServiceListItem(svc: ServiceDetail): ServiceListItem {
  return {
    id: svc.id,
    title: svc.title,
    provider_id: svc.provider_id,
    status: svc.status,
    category_id: svc.category_id,
    recipient_type: svc.recipient_type,
    base_price_minor: svc.base_price_minor,
    currency: svc.currency,
    remote_available: svc.remote_available,
    created_at: svc.created_at,
    updated_at: svc.updated_at,
  };
}

function toProviderListItem(prv: ProviderDetail): ProviderListItem {
  return {
    id: prv.id,
    name: prv.name,
    verification_status: prv.verification_status,
    location_id: prv.location_id,
    services_count: prv.services_count,
    active_offers_count: prv.active_offers_count,
    created_at: prv.created_at,
    updated_at: prv.updated_at,
  };
}

function buildServiceModerationResponse(
  svc: ServiceDetail,
  messageKey: string,
  message: string,
): ServiceModerationResponse {
  return {
    service_id: svc.id,
    new_status: svc.status,
    message_key: messageKey,
    message,
  };
}

function buildProviderModerationResponse(
  prv: ProviderDetail,
  messageKey: string,
  message: string,
): ProviderModerationResponse {
  return {
    provider_id: prv.id,
    new_status: prv.verification_status,
    message_key: messageKey,
    message,
  };
}

async function parseJsonBody<T>(req: Request): Promise<T | null> {
  try {
    return (await req.clone().json()) as T;
  } catch {
    return null;
  }
}

function parseIntId(raw: unknown): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function applyCursor<T extends { id: number; updated_at: string }>(
  rows: T[],
  url: URL,
): { items: T[]; next_last_id: number | null; has_more: boolean; count: number } {
  // Order DESC by id to match backend semantics.
  rows.sort((a, b) => b.id - a.id);
  const lastIdParam = url.searchParams.get("last_id");
  const limitParam = url.searchParams.get("limit");
  const last_id = lastIdParam ? Number(lastIdParam) : null;
  const limit = Math.max(1, Math.min(100, Number(limitParam ?? "20")));
  const filtered = last_id !== null ? rows.filter((r) => r.id < last_id) : rows;
  const page = filtered.slice(0, limit);
  const has_more = filtered.length > limit;
  const next_last_id = has_more && page.length > 0 ? (page[page.length - 1]?.id ?? null) : null;
  return { items: page, next_last_id, has_more, count: page.length };
}

function moderateOffer(rawId: string | readonly string[] | undefined, newStatus: OfferStatus, key: string) {
  const id = Number(rawId);
  if (Number.isNaN(id) || !isOfferStatus(newStatus)) {
    return HttpResponse.json({ message: "bad input" }, { status: 400 });
  }
  if (id === CONFLICT_OFFER_ID) {
    return HttpResponse.json(
      { error: { meta: { original_detail: "conflicting status" } } },
      { status: 409 },
    );
  }
  const updated = setOfferStatus(id, newStatus);
  if (!updated) return HttpResponse.json({ message: "not found" }, { status: 404 });
  return HttpResponse.json({
    offer_id: id,
    new_status: newStatus,
    message_key: `offers.${key}`,
    message: `Offer ${key}d`,
  });
}

export const handlers = [
  // ── Services list ──────────────────────────────────────────────────────
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim().toLowerCase() ?? "";
    const statusParam = url.searchParams.get("status");
    const providerIdParam = url.searchParams.get("provider_id");
    const providerIdFilter = providerIdParam ? Number(providerIdParam) : null;

    if (statusParam && !isServiceStatus(statusParam)) {
      return HttpResponse.json(
        { detail: `unknown status '${statusParam}'` },
        { status: 422 },
      );
    }

    let rows = getAll();
    if (statusParam) {
      const s = statusParam as ServiceStatus;
      rows = rows.filter((r) => r.status === s);
    }
    if (providerIdFilter !== null && Number.isInteger(providerIdFilter)) {
      rows = rows.filter((r) => r.provider_id === providerIdFilter);
    }
    if (search) {
      rows = rows.filter((r) => r.title.toLowerCase().includes(search));
    }
    const page = applyCursor(rows, url);
    return HttpResponse.json({
      items: page.items.map(toServiceListItem),
      next_last_id: page.next_last_id,
      has_more: page.has_more,
      count: page.count,
    });
  }),

  // ── Service detail ─────────────────────────────────────────────────────
  http.get(`${BASE}/:id`, ({ params }) => {
    const id = parseIntId(params.id);
    if (id === null)
      return HttpResponse.json({ detail: "Invalid id" }, { status: 422 });
    const svc = getById(id);
    if (!svc) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(svc);
  }),

  // ── Service stats ──────────────────────────────────────────────────────
  http.get(`${BASE}/:id/stats`, ({ params }) => {
    const id = parseIntId(params.id);
    if (id === null)
      return HttpResponse.json({ detail: "Invalid id" }, { status: 422 });
    const svc = getById(id);
    if (!svc) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json({
      service_id: id,
      total_offers: 0,
      offers_by_status: {},
      active_offers_count: 0,
    });
  }),

  // ── Service mutations (A5.7 contract) ─────────────────────────────────
  http.post(`${BASE}/:id/approve`, ({ params }) => {
    const id = parseIntId(params.id);
    if (id === null)
      return HttpResponse.json({ detail: "Invalid id" }, { status: 422 });
    if (id === CONFLICT_SERVICE_ID) {
      return HttpResponse.json(
        { detail: "Service cannot be approved in its current state" },
        { status: 409 },
      );
    }
    const next = setStatus(id, "published");
    if (!next) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(
      buildServiceModerationResponse(next, "admin.marketplace.service.approved", "Service approved"),
    );
  }),

  http.post(`${BASE}/:id/reject`, async ({ params, request }) => {
    const id = parseIntId(params.id);
    if (id === null)
      return HttpResponse.json({ detail: "Invalid id" }, { status: 422 });
    const body = await parseJsonBody<{ reason?: unknown; comment?: unknown }>(
      request,
    );
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (reason.length === 0) {
      return HttpResponse.json({ detail: "reason required" }, { status: 422 });
    }
    if (id === CONFLICT_SERVICE_ID) {
      return HttpResponse.json({ detail: "Conflict" }, { status: 409 });
    }
    const next = setStatus(id, "draft");
    if (!next) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(
      buildServiceModerationResponse(next, "admin.marketplace.service.rejected", "Service rejected"),
    );
  }),

  http.post(`${BASE}/:id/unpublish`, ({ params }) => {
    const id = parseIntId(params.id);
    if (id === null)
      return HttpResponse.json({ detail: "Invalid id" }, { status: 422 });
    if (id === CONFLICT_SERVICE_ID) {
      return HttpResponse.json({ detail: "Conflict" }, { status: 409 });
    }
    const next = setStatus(id, "unpublished");
    if (!next) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(
      buildServiceModerationResponse(next, "admin.marketplace.service.unpublished", "Service unpublished"),
    );
  }),

  http.post(`${BASE}/:id/republish`, ({ params }) => {
    const id = parseIntId(params.id);
    if (id === null)
      return HttpResponse.json({ detail: "Invalid id" }, { status: 422 });
    if (id === CONFLICT_SERVICE_ID) {
      return HttpResponse.json({ detail: "Conflict" }, { status: 409 });
    }
    const next = setStatus(id, "published");
    if (!next) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(
      buildServiceModerationResponse(next, "admin.marketplace.service.republished", "Service republished"),
    );
  }),

  http.post(`${BASE}/:id/archive`, ({ params }) => {
    const id = parseIntId(params.id);
    if (id === null)
      return HttpResponse.json({ detail: "Invalid id" }, { status: 422 });
    if (id === CONFLICT_SERVICE_ID) {
      return HttpResponse.json({ detail: "Conflict" }, { status: 409 });
    }
    const next = setStatus(id, "archived");
    if (!next) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(
      buildServiceModerationResponse(next, "admin.marketplace.service.archived", "Service archived"),
    );
  }),

  // ── Service field-edit (M7) — partial DATA-field PATCH ────────────────
  http.patch(`${BASE}/:id/fields`, async ({ params, request }) => {
    const id = parseIntId(params.id);
    if (id === null)
      return HttpResponse.json({ detail: "Invalid id" }, { status: 422 });
    const body = await parseJsonBody<ServiceFieldsPatch>(request);
    if (body === null)
      return adminValidationError("Malformed request body");
    // Required (NON-nullable) strings cannot be sent empty — exercise 422.
    if (typeof body.title === "string" && body.title.trim() === "") {
      return HttpResponse.json(
        { detail: "title must not be empty" },
        { status: 422 },
      );
    }
    if (
      typeof body.pricing_type === "string" &&
      body.pricing_type.trim() === ""
    ) {
      return HttpResponse.json(
        { detail: "pricing_type must not be empty" },
        { status: 422 },
      );
    }
    const result = patchServiceFields(id, body);
    if (result === "not_found")
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    if (result === "invalid")
      return adminValidationError("Field cannot be cleared (non-nullable)");
    return HttpResponse.json(result);
  }),

  // ── Providers list ────────────────────────────────────────────────────
  http.get(PROVIDERS_BASE, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim().toLowerCase() ?? "";
    let rows = getAllProviders();
    if (search) {
      rows = rows.filter((r) => r.name.toLowerCase().includes(search));
    }
    const page = applyCursor(rows, url);
    return HttpResponse.json({
      items: page.items.map(toProviderListItem),
      next_last_id: page.next_last_id,
      has_more: page.has_more,
      count: page.count,
    });
  }),

  // ── Provider detail ───────────────────────────────────────────────────
  http.get(`${PROVIDERS_BASE}/:id`, ({ params }) => {
    const id = parseIntId(params.id);
    if (id === null)
      return HttpResponse.json({ detail: "Invalid id" }, { status: 422 });
    const prv = getProviderById(id);
    if (!prv) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(prv);
  }),

  // ── Provider stats ────────────────────────────────────────────────────
  http.get(`${PROVIDERS_BASE}/:id/stats`, ({ params }) => {
    const id = parseIntId(params.id);
    if (id === null)
      return HttpResponse.json({ detail: "Invalid id" }, { status: 422 });
    const prv = getProviderById(id);
    if (!prv) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json({
      provider_id: id,
      total_services: prv.services_count,
      services_by_status: {},
      active_offers_count: prv.active_offers_count,
    });
  }),

  // ── Provider mutations (A6.2 contract) ────────────────────────────────
  http.post(`${PROVIDERS_BASE}/:id/verify`, async ({ params, request }) => {
    const id = parseIntId(params.id);
    if (id === null)
      return HttpResponse.json({ detail: "Invalid id" }, { status: 422 });
    if (id === CONFLICT_PROVIDER_ID) {
      return HttpResponse.json(
        { detail: "Provider cannot be verified in its current state" },
        { status: 409 },
      );
    }
    const body = await parseJsonBody<{ message?: unknown }>(request);
    const message = typeof body?.message === "string" ? body.message : null;
    const next = setProviderStatus(id, "verified", {
      verification_message: message,
    });
    if (!next) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(
      buildProviderModerationResponse(next, "admin.marketplace.provider.verified", "Provider verified"),
    );
  }),

  http.post(`${PROVIDERS_BASE}/:id/block`, async ({ params, request }) => {
    const id = parseIntId(params.id);
    if (id === null)
      return HttpResponse.json({ detail: "Invalid id" }, { status: 422 });
    const body = await parseJsonBody<{ reason?: unknown }>(request);
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (reason.length === 0) {
      return HttpResponse.json({ detail: "reason required" }, { status: 422 });
    }
    if (id === CONFLICT_PROVIDER_ID) {
      return HttpResponse.json({ detail: "Conflict" }, { status: 409 });
    }
    const next = setProviderStatus(id, "blocked", { block_reason: reason });
    if (!next) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(
      buildProviderModerationResponse(next, "admin.marketplace.provider.blocked", "Provider blocked"),
    );
  }),

  http.post(`${PROVIDERS_BASE}/:id/unblock`, ({ params }) => {
    const id = parseIntId(params.id);
    if (id === null)
      return HttpResponse.json({ detail: "Invalid id" }, { status: 422 });
    if (id === CONFLICT_PROVIDER_ID) {
      return HttpResponse.json({ detail: "Conflict" }, { status: 409 });
    }
    const next = setProviderStatus(id, "verified", { block_reason: null });
    if (!next) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(
      buildProviderModerationResponse(next, "admin.marketplace.provider.unblocked", "Provider unblocked"),
    );
  }),

  http.delete(`${PROVIDERS_BASE}/:id`, ({ params }) => {
    const id = parseIntId(params.id);
    if (id === null)
      return HttpResponse.json({ detail: "Invalid id" }, { status: 422 });
    if (id === CONFLICT_PROVIDER_ID) {
      return HttpResponse.json({ detail: "Conflict" }, { status: 409 });
    }
    const prv = getProviderById(id);
    if (!prv) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    setProviderStatus(id, "canceled");
    return HttpResponse.json({
      provider_id: id,
      new_status: "canceled",
      message_key: "admin.marketplace.provider.canceled",
      message: "Provider canceled",
    });
  }),

  // ── Provider field-edit (M7) — partial DATA-field PATCH ───────────────
  http.patch(`${PROVIDERS_BASE}/:id/fields`, async ({ params, request }) => {
    const id = parseIntId(params.id);
    if (id === null)
      return HttpResponse.json({ detail: "Invalid id" }, { status: 422 });
    const body = await parseJsonBody<ProviderFieldsPatch>(request);
    if (body === null)
      return adminValidationError("Malformed request body");
    // Required (NON-nullable) strings cannot be sent empty — exercise 422.
    if (typeof body.name === "string" && body.name.trim() === "") {
      return HttpResponse.json(
        { detail: "name must not be empty" },
        { status: 422 },
      );
    }
    if (
      typeof body.account_currency === "string" &&
      body.account_currency.trim() === ""
    ) {
      return HttpResponse.json(
        { detail: "account_currency must not be empty" },
        { status: 422 },
      );
    }
    const result = patchProviderFields(id, body);
    if (result === "not_found")
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    if (result === "invalid")
      return adminValidationError("Field cannot be cleared (non-nullable)");
    return HttpResponse.json(result);
  }),

  // ── Offers SLA queue ──────────────────────────────────────────────────
  http.get(`${OFFERS_BASE}/review-sla/summary`, ({ request }) => {
    const url = new URL(request.url);
    const queueFilter = url.searchParams.getAll("queue_status") as QueueStatus[];
    const offers = getAllOffers().filter((o) => o.status === "on_review");
    const items = offers
      .filter((o) => queueFilter.length === 0 || queueFilter.includes(o.queue_status))
      .map(makeSlaSummaryItem);
    const counters = {
      total_on_review: offers.length,
      in_sla: offers.filter((o) => o.queue_status === "in_sla").length,
      warning: offers.filter((o) => o.queue_status === "warning").length,
      overdue_response: offers.filter((o) => o.queue_status === "overdue_response").length,
      closed_without_response_candidates: offers.filter((o) => o.queue_status === "closed_without_response").length,
    };
    return HttpResponse.json({ generated_at: new Date(0).toISOString(), counters, items });
  }),
  http.get(`${OFFERS_BASE}/:id/detail-card`, ({ params }) => {
    const id = Number(params.id);
    const offer = getOffer(id);
    if (!offer) return HttpResponse.json({ message: "not found" }, { status: 404 });
    return HttpResponse.json(offer);
  }),
  http.get(`${OFFERS_BASE}/review-sla/health`, () =>
    HttpResponse.json({
      generated_at: new Date(0).toISOString(),
      items: [0, 1, 2, 3].map(makeServiceHealthItem),
    }),
  ),
  http.get(`${OFFERS_BASE}/review-sla/providers/health`, () =>
    HttpResponse.json({
      generated_at: new Date(0).toISOString(),
      items: [0, 1, 2, 3].map(makeProviderHealthItem),
    }),
  ),
  http.get(`${OFFERS_BASE}/review-sla/dispatch-runs`, () =>
    HttpResponse.json({
      items: [0, 1, 2].map(makeDispatchRunLogItem),
      total: 3,
    }),
  ),
  http.get(`${OFFERS_BASE}/review-sla/providers/dlq`, () =>
    HttpResponse.json({
      items: [0, 1].map(makeDlqItem),
      total: 2,
    }),
  ),
  http.post(`${OFFERS_BASE}/:id/approve`, ({ params }) => moderateOffer(params.id, "active", "approve")),
  http.post(`${OFFERS_BASE}/:id/reject`, async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    if (!body.reason || body.reason.trim().length < 10) {
      return HttpResponse.json({ message: "reason must be at least 10 characters" }, { status: 422 });
    }
    return moderateOffer(params.id, "rejected", "reject");
  }),
  http.post(`${OFFERS_BASE}/:id/archive`, ({ params }) => moderateOffer(params.id, "archived", "archive")),
  http.post(`${OFFERS_BASE}/:id/disable`, ({ params }) => moderateOffer(params.id, "disabled", "disable")),
  http.post(`${OFFERS_BASE}/:id/enable`, ({ params }) => moderateOffer(params.id, "active", "enable")),
  http.post(`${OFFERS_BASE}/review-sla/dispatch`, () =>
    HttpResponse.json({
      generated_at: new Date(0).toISOString(),
      auto_close_enabled: true,
      checked_offers: 10,
      reminders_sent: 3,
      auto_closed: 1,
      reminder_offer_ids: [1, 2, 3],
      auto_closed_offer_ids: [4],
      escalations_sent: 0,
      escalated_service_ids: [],
    }),
  ),
  http.post(`${OFFERS_BASE}/review-sla/providers/dispatch`, () =>
    HttpResponse.json({
      generated_at: new Date(0).toISOString(),
      checked_providers: 5,
      escalations_sent: 1,
      escalated_provider_ids: [201],
      channels: ["email"],
      delivery_outcomes: [],
    }),
  ),
  http.post(`${OFFERS_BASE}/review-sla/providers/dlq/replay`, async ({ request }) => {
    const body = (await request.json().catch(() => ({ mode: "dry_run" }))) as { mode?: string };
    const mode = body.mode === "apply" ? "apply" : "dry_run";
    return HttpResponse.json({
      mode,
      total_candidates: 2,
      processed_items: 2,
      sent_replays: mode === "apply" ? 2 : 0,
      failed_replays: 0,
      skipped_replays: 0,
      channels: ["email"],
      replayed_keys: mode === "apply" ? ["dlq_0", "dlq_1"] : [],
      candidates: [],
      delivery_outcomes: [],
      replay_run_id: mode === "apply" ? "replay_run_1" : null,
    });
  }),

  // ---- Marketplace categories (declare literal /list before /:id) ----
  http.post(`${CATEGORIES_BASE}/list`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      search?: string;
      sort?: string;
      last_id?: number;
      limit?: number;
    };
    return HttpResponse.json(listCategoriesPage(body));
  }),
  http.post(CATEGORIES_BASE, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const created = createCategoryRecord(toCategoryWrite(body));
    return HttpResponse.json(created, { status: 201 });
  }),
  http.get(`${CATEGORIES_BASE}/:id`, ({ params }) => {
    const found = getCategoryById(Number(params.id));
    if (!found)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(found);
  }),
  http.put(`${CATEGORIES_BASE}/:id`, async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const updated = updateCategoryRecord(
      Number(params.id),
      toCategoryWrite(body),
    );
    if (!updated)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(updated);
  }),
  http.delete(`${CATEGORIES_BASE}/:id`, ({ params, request }) => {
    const role = operatorRole(request);
    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return HttpResponse.json(
        {
          error: {
            message: "forbidden",
            meta: { original_detail: "Requires ADMIN role" },
          },
        },
        { status: 403 },
      );
    }
    const id = Number(params.id);
    if (hasChildren(id)) {
      return HttpResponse.json(
        {
          error: {
            message: "conflict",
            meta: { original_detail: "Category has child categories" },
          },
        },
        { status: 409 },
      );
    }
    const ok = deleteCategoryRecord(id);
    if (!ok) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Marketplace promo codes (literal /list + /:id/deactivate first) ----
  http.post(`${PROMO_CODES_BASE}/list`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      code?: string;
      is_active?: boolean;
      item_type?: string;
      limit?: number;
      offset?: number;
    };
    return HttpResponse.json(listPromoCodesPage(body));
  }),
  http.post(`${PROMO_CODES_BASE}/:id/deactivate`, ({ params }) => {
    const updated = deactivatePromoCodeRecord(Number(params.id));
    if (!updated)
      return HttpResponse.json(
        {
          error: {
            message: "not_found",
            meta: { original_detail: "Promo code not found" },
          },
        },
        { status: 404 },
      );
    return HttpResponse.json(updated);
  }),
  http.post(PROMO_CODES_BASE, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const created = createPromoCodeRecord(toPromoCodeWrite(body));
    return HttpResponse.json(created, { status: 201 });
  }),
  http.get(`${PROMO_CODES_BASE}/:id`, ({ params }) => {
    const found = getPromoCodeById(Number(params.id));
    if (!found)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(found);
  }),
  http.patch(`${PROMO_CODES_BASE}/:id`, async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const updated = updatePromoCodeRecord(
      Number(params.id),
      toPromoCodePatch(body),
    );
    if (!updated)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(updated);
  }),

  // ---- Marketplace attribute-definitions (literal /list before /:key) ----
  http.post(`${ATTRIBUTE_DEFINITIONS_BASE}/list`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      search?: string;
      group_name?: string;
      is_active?: boolean;
      sort?: string;
      last_id?: number;
      limit?: number;
    };
    return HttpResponse.json(listAttributeDefinitionsPage(body));
  }),
  http.post(ATTRIBUTE_DEFINITIONS_BASE, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const created = createAttributeDefinitionRecord(
      toAttributeDefinitionWrite(body),
    );
    return HttpResponse.json(created, { status: 201 });
  }),
  http.get(`${ATTRIBUTE_DEFINITIONS_BASE}/:key`, ({ params }) => {
    const found = getAttributeDefinitionByKey(String(params.key));
    if (!found)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(found);
  }),
  http.put(`${ATTRIBUTE_DEFINITIONS_BASE}/:key`, async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const patch = toAttributeDefinitionWrite(body);
    // Backend rejects an empty update body with 400 (parity).
    if (Object.keys(patch).length === 0) {
      return HttpResponse.json(
        {
          error: {
            message: "Request cannot be processed",
            meta: { original_detail: "No fields to update" },
          },
        },
        { status: 400 },
      );
    }
    const updated = updateAttributeDefinitionRecord(String(params.key), patch);
    if (!updated)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(updated);
  }),
  http.delete(`${ATTRIBUTE_DEFINITIONS_BASE}/:key`, ({ params, request }) => {
    const role = operatorRole(request);
    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return HttpResponse.json(
        {
          error: {
            message: "forbidden",
            meta: { original_detail: "Requires ADMIN role" },
          },
        },
        { status: 403 },
      );
    }
    const ok = deleteAttributeDefinitionRecord(String(params.key));
    if (!ok) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Admin team management (declare literal /invitations before /:id) ----
  http.get(ADMINS_BASE, () => {
    const items = getAllAdmins().map(toAdminListItem);
    return HttpResponse.json({ items, total: items.length });
  }),
  http.get(`${ADMINS_BASE}/invitations`, () => {
    const items = getAllInvitations();
    return HttpResponse.json({ items, total: items.length });
  }),
  http.post(`${ADMINS_BASE}/invitations`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      email?: unknown;
      role?: unknown;
    };
    const email = typeof body.email === "string" ? body.email : "";
    const role = typeof body.role === "string" && isAdminRole(body.role) ? body.role : null;
    if (!email || !role) {
      return HttpResponse.json({ detail: "Invalid invitation" }, { status: 422 });
    }
    if (getAllAdmins().some((a) => a.email.toLowerCase() === email.toLowerCase())) {
      return HttpResponse.json(
        { detail: "an admin with this email already exists" },
        { status: 400 },
      );
    }
    return HttpResponse.json(createInvitationRecord(email, role), { status: 201 });
  }),
  http.post(`${ADMINS_BASE}/invitations/:token/accept`, async ({ params, request }) => {
    const token = String(params.token);
    const body = (await request.json().catch(() => ({}))) as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 12) {
      return HttpResponse.json({ detail: "password too short" }, { status: 422 });
    }
    if (token === "expired-token") {
      return HttpResponse.json({ detail: "invitation has expired" }, { status: 400 });
    }
    if (token === "used-token") {
      return HttpResponse.json(
        { detail: "invitation has already been used" },
        { status: 400 },
      );
    }
    return HttpResponse.json(
      {
        id: "55555555-5555-4555-8555-555555555555",
        email: "invited@example.com",
        role: "MODERATOR",
        is_active: true,
        display_name: null,
        last_login_at: null,
      },
      { status: 201 },
    );
  }),
  http.delete(`${ADMINS_BASE}/invitations/:id`, ({ params }) => {
    const ok = deleteInvitationRecord(String(params.id));
    if (!ok) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(`${ADMINS_BASE}/:id`, ({ params }) => {
    const admin = getAdminById(String(params.id));
    if (!admin) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(admin);
  }),
  http.patch(`${ADMINS_BASE}/:id`, async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      role?: unknown;
      is_active?: unknown;
    };
    const patch: { role?: AdminDetail["role"]; is_active?: boolean } = {};
    if (typeof body.role === "string" && isAdminRole(body.role)) patch.role = body.role;
    if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
    if (patch.role === undefined && patch.is_active === undefined) {
      return HttpResponse.json({ detail: "no fields to update" }, { status: 400 });
    }
    const targetId = String(params.id);
    const target = getAdminById(targetId);
    if (!target) return HttpResponse.json({ detail: "Not found" }, { status: 404 });

    // Backend admin-domain guards (eventup-backend #100). Self-guard is checked
    // before last-active-superadmin so an operator acting on their own row gets
    // the self message; a different operator hits the superadmin guard.
    const deactivating = patch.is_active === false;
    const demoting = patch.role !== undefined && patch.role !== target.role;
    if (operatorSub(request) === targetId) {
      if (deactivating) {
        return adminValidationError("You cannot deactivate your own account.");
      }
      if (demoting) {
        return adminValidationError("You cannot change your own role.");
      }
    }
    if (
      target.role === "SUPERADMIN" &&
      target.is_active &&
      activeSuperadminCount() === 1
    ) {
      if (deactivating) {
        return adminValidationError(
          "Cannot deactivate the last active superadmin.",
        );
      }
      if (patch.role !== undefined && patch.role !== "SUPERADMIN") {
        return adminValidationError(
          "Cannot change the role of the last active superadmin.",
        );
      }
    }

    const updated = updateAdminRecord(targetId, patch);
    if (!updated) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(toAdminListItem(updated));
  }),
  http.post(`${ADMINS_BASE}/:id/reviewer-scopes`, async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as { permission_key?: unknown };
    const key = typeof body.permission_key === "string" ? body.permission_key : "";
    if (!key) return HttpResponse.json({ detail: "permission key required" }, { status: 422 });
    if (!getAdminById(String(params.id))) {
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    }
    const scope = grantScopeRecord(String(params.id), key);
    if (!scope) {
      return HttpResponse.json(
        { detail: "reviewer scope already granted" },
        { status: 400 },
      );
    }
    return HttpResponse.json(scope, { status: 201 });
  }),
  http.delete(`${ADMINS_BASE}/:id/reviewer-scopes/:key`, ({ params }) => {
    const ok = revokeScopeRecord(String(params.id), String(params.key));
    if (!ok) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return new HttpResponse(null, { status: 204 });
  }),

  // ── M2 traffic analytics (read-only) ───────────────────────────────────
  http.get(`${ANALYTICS_BASE}/summary`, ({ request }) => {
    const url = new URL(request.url);
    const from = url.searchParams.get("date_from") ?? DEFAULT_FROM;
    const to = url.searchParams.get("date_to") ?? DEFAULT_TO;
    return HttpResponse.json(buildSummary(from, to));
  }),
  http.get(`${ANALYTICS_BASE}/top-listings`, ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? "service";
    if (!ANALYTICS_TYPES.has(type)) {
      return HttpResponse.json(
        { detail: `unknown subject type '${type}'` },
        { status: 400 },
      );
    }
    const from = url.searchParams.get("date_from") ?? DEFAULT_FROM;
    const to = url.searchParams.get("date_to") ?? DEFAULT_TO;
    const limit = Number(url.searchParams.get("limit") ?? "20");
    return HttpResponse.json(buildTopListings(type, from, to, limit));
  }),
  http.get(
    `${ANALYTICS_BASE}/listings/:type/:id`,
    ({ params, request }) => {
      const type = String(params.type);
      if (!ANALYTICS_TYPES.has(type)) {
        return HttpResponse.json(
          { detail: `unknown subject type '${type}'` },
          { status: 400 },
        );
      }
      const url = new URL(request.url);
      const from = url.searchParams.get("date_from") ?? DEFAULT_FROM;
      const to = url.searchParams.get("date_to") ?? DEFAULT_TO;
      const detail = buildListingDetail(type, Number(params.id), from, to);
      if (!detail) {
        return HttpResponse.json(
          { detail: `no traffic for ${type} #${params.id}` },
          { status: 404 },
        );
      }
      return HttpResponse.json(detail);
    },
  ),

  // ---- Promotions catalog (M3a) -----------------------------------------
  // products: full CRUD. Register collection list/create, then the literal
  // /deactivate before /:id so MSW's first-match doesn't swallow it.
  http.get(`${PROMOTIONS_BASE}/products`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      listProductsPage({
        is_active: queryBool(url.searchParams.get("is_active")),
        q: url.searchParams.get("q") ?? undefined,
        limit: queryNum(url.searchParams.get("limit")),
        offset: queryNum(url.searchParams.get("offset")),
      }),
    );
  }),
  http.post(`${PROMOTIONS_BASE}/products`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const created = createProductRecord(toProductWrite(body));
    return HttpResponse.json(created, { status: 201 });
  }),
  http.post(
    `${PROMOTIONS_BASE}/products/:id/deactivate`,
    ({ params }) => {
      const updated = deactivateProductRecord(Number(params.id));
      if (!updated)
        return HttpResponse.json({ detail: "Not found" }, { status: 404 });
      return HttpResponse.json(updated);
    },
  ),
  http.get(`${PROMOTIONS_BASE}/products/:id`, ({ params }) => {
    const found = getProductById(Number(params.id));
    if (!found)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(found);
  }),
  http.patch(`${PROMOTIONS_BASE}/products/:id`, async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const updated = updateProductRecord(Number(params.id), toProductWrite(body));
    if (!updated)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(updated);
  }),

  // tariffs: list + create + update (no detail, no deactivate)
  http.get(`${PROMOTIONS_BASE}/tariffs`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      listTariffsPage({
        product_id: queryNum(url.searchParams.get("product_id")),
        limit: queryNum(url.searchParams.get("limit")),
        offset: queryNum(url.searchParams.get("offset")),
      }),
    );
  }),
  http.post(`${PROMOTIONS_BASE}/tariffs`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const created = createTariffRecord(toTariffWrite(body));
    return HttpResponse.json(created, { status: 201 });
  }),
  http.patch(`${PROMOTIONS_BASE}/tariffs/:id`, async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const updated = updateTariffRecord(Number(params.id), toTariffWrite(body));
    if (!updated)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(updated);
  }),

  // discount-rules: list + create + update + deactivate (no detail)
  http.get(`${PROMOTIONS_BASE}/discount-rules`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      listDiscountRulesPage({
        product_id: queryNum(url.searchParams.get("product_id")),
        tariff_id: queryNum(url.searchParams.get("tariff_id")),
        is_active: queryBool(url.searchParams.get("is_active")),
        limit: queryNum(url.searchParams.get("limit")),
        offset: queryNum(url.searchParams.get("offset")),
      }),
    );
  }),
  http.post(`${PROMOTIONS_BASE}/discount-rules`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const created = createDiscountRuleRecord(toDiscountRuleWrite(body));
    return HttpResponse.json(created, { status: 201 });
  }),
  http.post(
    `${PROMOTIONS_BASE}/discount-rules/:id/deactivate`,
    ({ params }) => {
      const updated = deactivateDiscountRuleRecord(Number(params.id));
      if (!updated)
        return HttpResponse.json({ detail: "Not found" }, { status: 404 });
      return HttpResponse.json(updated);
    },
  ),
  http.patch(
    `${PROMOTIONS_BASE}/discount-rules/:id`,
    async ({ params, request }) => {
      const body = (await request.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      const updated = updateDiscountRuleRecord(
        Number(params.id),
        toDiscountRuleWrite(body),
      );
      if (!updated)
        return HttpResponse.json({ detail: "Not found" }, { status: 404 });
      return HttpResponse.json(updated);
    },
  ),

  // monthly-discounts: list + create + update + deactivate (no detail)
  http.get(`${PROMOTIONS_BASE}/monthly-discounts`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      listMonthlyDiscountsPage({
        product_id: queryNum(url.searchParams.get("product_id")),
        is_active: queryBool(url.searchParams.get("is_active")),
        limit: queryNum(url.searchParams.get("limit")),
        offset: queryNum(url.searchParams.get("offset")),
      }),
    );
  }),
  http.post(`${PROMOTIONS_BASE}/monthly-discounts`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const created = createMonthlyDiscountRecord(toMonthlyDiscountWrite(body));
    return HttpResponse.json(created, { status: 201 });
  }),
  http.post(
    `${PROMOTIONS_BASE}/monthly-discounts/:id/deactivate`,
    ({ params }) => {
      const updated = deactivateMonthlyDiscountRecord(Number(params.id));
      if (!updated)
        return HttpResponse.json({ detail: "Not found" }, { status: 404 });
      return HttpResponse.json(updated);
    },
  ),
  http.patch(
    `${PROMOTIONS_BASE}/monthly-discounts/:id`,
    async ({ params, request }) => {
      const body = (await request.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      const updated = updateMonthlyDiscountRecord(
        Number(params.id),
        toMonthlyDiscountWrite(body),
      );
      if (!updated)
        return HttpResponse.json({ detail: "Not found" }, { status: 404 });
      return HttpResponse.json(updated);
    },
  ),

  // zones: list + detail + create + update (no deactivate)
  http.get(`${PROMOTIONS_BASE}/zones`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      listZonesPage({
        limit: queryNum(url.searchParams.get("limit")),
        offset: queryNum(url.searchParams.get("offset")),
      }),
    );
  }),
  http.post(`${PROMOTIONS_BASE}/zones`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const created = createZoneRecord(toZoneWrite(body));
    return HttpResponse.json(created, { status: 201 });
  }),
  http.get(`${PROMOTIONS_BASE}/zones/:id`, ({ params }) => {
    const found = getZoneById(Number(params.id));
    if (!found)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(found);
  }),
  http.patch(`${PROMOTIONS_BASE}/zones/:id`, async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const updated = updateZoneRecord(Number(params.id), toZoneWrite(body));
    if (!updated)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(updated);
  }),

  // ---- Promotions orders (M3b, READ-ONLY) -------------------------------
  // list (status / service_id / created_from / created_to filters) + detail.
  http.get(`${PROMOTIONS_BASE}/orders`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      listOrdersPage({
        status: queryStr(url.searchParams.get("status")),
        service_id: queryNum(url.searchParams.get("service_id")),
        created_from: queryStr(url.searchParams.get("created_from")),
        created_to: queryStr(url.searchParams.get("created_to")),
        limit: queryNum(url.searchParams.get("limit")),
        offset: queryNum(url.searchParams.get("offset")),
      }),
    );
  }),
  http.get(`${PROMOTIONS_BASE}/orders/:id`, ({ params }) => {
    const found = getOrderById(Number(params.id));
    if (!found)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(found);
  }),

  // ---- Promotions campaigns (M3b, READ + cancel) ------------------------
  // Register list/create, then the literal /cancel before /:id so MSW's
  // first-match doesn't route the cancel to the detail handler.
  http.get(`${PROMOTIONS_BASE}/campaigns`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      listCampaignsPage({
        status: queryStr(url.searchParams.get("status")),
        zone_id: queryNum(url.searchParams.get("zone_id")),
        service_id: queryNum(url.searchParams.get("service_id")),
        limit: queryNum(url.searchParams.get("limit")),
        offset: queryNum(url.searchParams.get("offset")),
      }),
    );
  }),
  http.post(`${PROMOTIONS_BASE}/campaigns/:id/cancel`, ({ params }) => {
    const result = cancelCampaignRecord(Number(params.id));
    if (result.kind === "not_found")
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    if (result.kind === "conflict")
      // Mirrors map_marketplace_exception: generic message + specific reason in
      // meta.original_detail (the FE surfaces that first).
      return adminValidationError(result.reason);
    return HttpResponse.json(result.campaign);
  }),
  http.get(`${PROMOTIONS_BASE}/campaigns/:id`, ({ params }) => {
    const found = getCampaignById(Number(params.id));
    if (!found)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(found);
  }),

  // ---- Quality / ranking (M4) -------------------------------------------
  // Service metrics: list + detail + override set (POST) / clear (DELETE).
  // Register the literal /override before /:id so MSW's first-match doesn't
  // route the override to the detail handler. Writes gate SUPERADMIN.
  http.get(`${QUALITY_BASE}/services`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      listServiceMetricsPage({
        quality_tier: queryStr(url.searchParams.get("quality_tier")),
        provider_id: queryNum(url.searchParams.get("provider_id")),
        has_override: queryBool(url.searchParams.get("has_override")),
        limit: queryNum(url.searchParams.get("limit")),
        offset: queryNum(url.searchParams.get("offset")),
      }),
    );
  }),
  http.post(
    `${QUALITY_BASE}/services/:id/override`,
    async ({ params, request }) => {
      const forbidden = forbidNonSuperadminQuality(request);
      if (forbidden) return forbidden;
      const body = (await request.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      const write = toOverrideWrite(body);
      if (!write)
        return adminValidationError("coefficient and reason are required");
      const updated = setServiceOverrideRecord(Number(params.id), write);
      if (!updated)
        return HttpResponse.json({ detail: "Not found" }, { status: 404 });
      return HttpResponse.json(updated);
    },
  ),
  http.delete(`${QUALITY_BASE}/services/:id/override`, ({ params, request }) => {
    const forbidden = forbidNonSuperadminQuality(request);
    if (forbidden) return forbidden;
    const updated = clearServiceOverrideRecord(Number(params.id));
    if (!updated)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(updated);
  }),
  http.get(`${QUALITY_BASE}/services/:id`, ({ params }) => {
    const found = getServiceMetricById(Number(params.id));
    if (!found)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(found);
  }),

  // Provider metrics: list + detail (read-only).
  http.get(`${QUALITY_BASE}/providers`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      listProviderMetricsPage({
        limit: queryNum(url.searchParams.get("limit")),
        offset: queryNum(url.searchParams.get("offset")),
      }),
    );
  }),
  http.get(`${QUALITY_BASE}/providers/:id`, ({ params }) => {
    const found = getProviderMetricById(Number(params.id));
    if (!found)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(found);
  }),

  // Formula configs: list + activate (POST /{id}/activate) + rollback
  // (POST /rollback) + detail. Register the literal /rollback and /:id/activate
  // before /:id. Writes gate SUPERADMIN.
  http.get(`${QUALITY_BASE}/formula-configs`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      listFormulaConfigsPage({
        limit: queryNum(url.searchParams.get("limit")),
        offset: queryNum(url.searchParams.get("offset")),
      }),
    );
  }),
  http.post(`${QUALITY_BASE}/formula-configs/rollback`, ({ request }) => {
    const forbidden = forbidNonSuperadminQuality(request);
    if (forbidden) return forbidden;
    const result = rollbackFormulaConfigRecord();
    if (result.kind === "conflict")
      return adminValidationError(result.reason);
    return HttpResponse.json(result.config);
  }),
  http.post(
    `${QUALITY_BASE}/formula-configs/:id/activate`,
    ({ params, request }) => {
      const forbidden = forbidNonSuperadminQuality(request);
      if (forbidden) return forbidden;
      const result = activateFormulaConfigRecord(Number(params.id));
      if (result.kind === "not_found")
        return HttpResponse.json({ detail: "Not found" }, { status: 404 });
      if (result.kind === "conflict")
        return adminValidationError(result.reason);
      return HttpResponse.json(result.config);
    },
  ),
  http.get(`${QUALITY_BASE}/formula-configs/:id`, ({ params }) => {
    const found = getFormulaConfigById(Number(params.id));
    if (!found)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(found);
  }),

  // Anomalies: list (resolved filter) + review (POST /{id}/review) + detail.
  // Register the literal /review before /:id. Review gates SUPERADMIN.
  http.get(`${QUALITY_BASE}/anomalies`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      listAnomaliesPage({
        service_id: queryNum(url.searchParams.get("service_id")),
        provider_id: queryNum(url.searchParams.get("provider_id")),
        severity: queryStr(url.searchParams.get("severity")),
        event_type: queryStr(url.searchParams.get("event_type")),
        resolved: queryBool(url.searchParams.get("resolved")),
        limit: queryNum(url.searchParams.get("limit")),
        offset: queryNum(url.searchParams.get("offset")),
      }),
    );
  }),
  http.post(
    `${QUALITY_BASE}/anomalies/:id/review`,
    ({ params, request }) => {
      const forbidden = forbidNonSuperadminQuality(request);
      if (forbidden) return forbidden;
      const result = reviewAnomalyRecord(Number(params.id));
      if (result.kind === "not_found")
        return HttpResponse.json({ detail: "Not found" }, { status: 404 });
      if (result.kind === "conflict")
        return adminValidationError(result.reason);
      return HttpResponse.json(result.anomaly);
    },
  ),
  http.get(`${QUALITY_BASE}/anomalies/:id`, ({ params }) => {
    const found = getAnomalyById(Number(params.id));
    if (!found)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(found);
  }),

  // ---- Marketplace payments (M5, READ-ONLY) -----------------------------
  // Offset/limit list with status / currency / resource_type / q filters,
  // plus detail (404 on unknown id). No write/refund path exists by design.
  http.get(PAYMENTS_BASE, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      listPaymentsPage({
        resource_type: queryStr(url.searchParams.get("resource_type")),
        status: queryStr(url.searchParams.get("status")),
        currency: queryStr(url.searchParams.get("currency")),
        created_from: queryStr(url.searchParams.get("created_from")),
        created_to: queryStr(url.searchParams.get("created_to")),
        q: queryStr(url.searchParams.get("q")),
        limit: queryNum(url.searchParams.get("limit")),
        offset: queryNum(url.searchParams.get("offset")),
      }),
    );
  }),
  http.get(`${PAYMENTS_BASE}/:id`, ({ params }) => {
    const id = parseIntId(params.id);
    if (id === null)
      return HttpResponse.json({ detail: "Invalid id" }, { status: 422 });
    const found = getPaymentById(id);
    if (!found)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(found);
  }),

  // ---- Unified audit log (M6, READ-ONLY) --------------------------------
  // The list lives at the router ROOT (AUDIT_BASE, no sub-segment) and the
  // detail hangs off `${AUDIT_BASE}/:id` (UUID). MSW matches `/audit` and
  // `/audit/:id` distinctly, so the detail handler does not shadow the list.
  // Offset/limit list with actor_email / action / entity_type / success /
  // realm / actor_id / date-range filters. THIS SURFACE IS THE AUDIT LOG —
  // there is no write path by design.
  http.get(AUDIT_BASE, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      listAuditEventsPage({
        actor_id: queryStr(url.searchParams.get("actor_id")),
        actor_email: queryStr(url.searchParams.get("actor_email")),
        action: queryStr(url.searchParams.get("action")),
        entity_type: queryStr(url.searchParams.get("entity_type")),
        success: queryBool(url.searchParams.get("success")),
        realm: queryStr(url.searchParams.get("realm")),
        occurred_from: queryStr(url.searchParams.get("occurred_from")),
        occurred_to: queryStr(url.searchParams.get("occurred_to")),
        limit: queryNum(url.searchParams.get("limit")),
        offset: queryNum(url.searchParams.get("offset")),
      }),
    );
  }),
  http.get(`${AUDIT_BASE}/:id`, ({ params }) => {
    const found = getAuditEventById(String(params.id));
    if (!found)
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(found);
  }),
];
