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

const BASE = buildApiUrl("/eventup-admin/v1/marketplace/services");
const PROVIDERS_BASE = buildApiUrl("/eventup-admin/v1/marketplace/providers");
const OFFERS_BASE = buildApiUrl("/eventup-admin/v1/marketplace/offers");
const ADMINS_BASE = buildApiUrl("/eventup-admin/v1/admins");

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
    const updated = updateAdminRecord(String(params.id), patch);
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
];
