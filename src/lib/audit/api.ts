import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  AuditEventDetail,
  AuditListQuery,
  AuditListResponse,
} from "./types";

// The audit list lives at the router ROOT (no sub-segment), so BASE is the
// prefix itself; the detail hangs off `${BASE}/{id}`.
const BASE = "/eventup-admin/v1/audit";

function buildListPath(query: AuditListQuery): string {
  const params = new URLSearchParams();
  if (query.actor_id) params.set("actor_id", query.actor_id);
  if (query.actor_email) params.set("actor_email", query.actor_email);
  if (query.action) params.set("action", query.action);
  if (query.entity_type) params.set("entity_type", query.entity_type);
  if (query.success !== undefined) params.set("success", String(query.success));
  if (query.realm) params.set("realm", query.realm);
  if (query.occurred_from) params.set("occurred_from", query.occurred_from);
  if (query.occurred_to) params.set("occurred_to", query.occurred_to);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.offset !== undefined) params.set("offset", String(query.offset));
  const qs = params.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

export function listAuditEvents(
  query: AuditListQuery = {},
): Promise<ApiFetchResult<AuditListResponse>> {
  return apiFetch<AuditListResponse>(buildListPath(query));
}

export function getAuditEvent(
  id: string,
): Promise<ApiFetchResult<AuditEventDetail>> {
  return apiFetch<AuditEventDetail>(`${BASE}/${encodeURIComponent(id)}`);
}
