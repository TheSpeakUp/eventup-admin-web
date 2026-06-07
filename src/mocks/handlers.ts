import { http, HttpResponse } from "msw";
import { buildApiUrl } from "@/lib/api-config";
import { isServiceStatus, type ServiceSummary } from "@/lib/services/types";
import { getAll, getById, setStatus } from "./store";

const BASE = buildApiUrl("/admin/v2/services");

function toSummary(svc: ReturnType<typeof getById> & object): ServiceSummary {
  return {
    id: svc.id,
    title: svc.title,
    provider_name: svc.provider_name,
    category: svc.category,
    price_cents: svc.price_cents,
    currency: svc.currency,
    status: svc.status,
    updated_at: svc.updated_at,
  };
}

async function parseReason(req: Request): Promise<string | null> {
  try {
    const body = (await req.clone().json()) as { reason?: unknown };
    return typeof body.reason === "string" ? body.reason : null;
  } catch {
    return null;
  }
}

export const handlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
    const statusParam = url.searchParams.get("status");
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const pageSize = Math.max(
      1,
      Math.min(100, Number(url.searchParams.get("page_size") ?? "10")),
    );

    let rows = getAll();
    if (statusParam && isServiceStatus(statusParam)) {
      rows = rows.filter((s) => s.status === statusParam);
    }
    if (q) {
      rows = rows.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.provider_name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q),
      );
    }
    rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const total = rows.length;
    const start = (page - 1) * pageSize;
    const items = rows.slice(start, start + pageSize).map(toSummary);
    return HttpResponse.json({ items, total, page, page_size: pageSize });
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const svc = getById(String(params.id));
    if (!svc) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(svc);
  }),

  http.post(`${BASE}/:id/approve`, ({ params }) => {
    const id = String(params.id);
    if (id === "svc_conflict") {
      return HttpResponse.json(
        { detail: "Service is in a state that cannot be approved" },
        { status: 409 },
      );
    }
    const next = setStatus(id, "published", { moderator: "admin@example.com" });
    if (!next) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(toSummary(next));
  }),

  http.post(`${BASE}/:id/reject`, async ({ params, request }) => {
    const id = String(params.id);
    const reason = await parseReason(request);
    if (!reason || reason.length < 10) {
      return HttpResponse.json({ detail: "reason must be 10+ chars" }, { status: 422 });
    }
    if (id === "svc_conflict") {
      return HttpResponse.json({ detail: "Conflict" }, { status: 409 });
    }
    const next = setStatus(id, "rejected", { note: reason });
    if (!next) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(toSummary(next));
  }),

  http.post(`${BASE}/:id/request-changes`, async ({ params, request }) => {
    const id = String(params.id);
    const reason = await parseReason(request);
    if (!reason || reason.length < 10) {
      return HttpResponse.json({ detail: "reason must be 10+ chars" }, { status: 422 });
    }
    if (id === "svc_conflict") {
      return HttpResponse.json({ detail: "Conflict" }, { status: 409 });
    }
    const next = setStatus(id, "needs_changes", { note: reason });
    if (!next) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(toSummary(next));
  }),

  http.post(`${BASE}/:id/hide`, ({ params }) => {
    const id = String(params.id);
    if (id === "svc_conflict") {
      return HttpResponse.json({ detail: "Conflict" }, { status: 409 });
    }
    const next = setStatus(id, "hidden");
    if (!next) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(toSummary(next));
  }),

  http.post(`${BASE}/:id/restore`, ({ params }) => {
    const id = String(params.id);
    if (id === "svc_conflict") {
      return HttpResponse.json({ detail: "Conflict" }, { status: 409 });
    }
    const next = setStatus(id, "published");
    if (!next) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(toSummary(next));
  }),
];
