import { http, HttpResponse } from "msw";
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
import { getAll, getById, setStatus } from "./store";
import {
  getAllProviders,
  getProviderById,
  setProviderStatus,
} from "./providers-store";
import type { ServiceDetail } from "@/lib/services/types";
import type { ProviderDetail } from "@/lib/providers/types";

const BASE = buildApiUrl("/eventup-admin/v1/marketplace/services");
const PROVIDERS_BASE = buildApiUrl("/eventup-admin/v1/marketplace/providers");

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
];
