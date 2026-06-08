import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  DispatchRunLogResponse,
  DispatchRunsQuery,
  DlqQuery,
  DlqReplayRequest,
  DlqReplayResponse,
  DlqResponse,
  OfferDetailCard,
  OfferDispatchResponse,
  OfferModerationResponse,
  ProviderDispatchResponse,
  ProviderHealthResponse,
  ServiceHealthResponse,
  SlaSummary,
  SlaSummaryQuery,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace/offers";

function append(params: URLSearchParams, key: string, value: string | number | boolean | undefined): void {
  if (value === undefined || value === null) return;
  params.set(key, String(value));
}

function appendArray(params: URLSearchParams, key: string, values: readonly (string | number)[] | undefined): void {
  if (!values || values.length === 0) return;
  for (const v of values) params.append(key, String(v));
}

function withQs(path: string, params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function getSlaSummary(query: SlaSummaryQuery = {}): Promise<ApiFetchResult<SlaSummary>> {
  const p = new URLSearchParams();
  append(p, "service_id", query.service_id);
  appendArray(p, "service_ids", query.service_ids);
  append(p, "provider_id", query.provider_id);
  appendArray(p, "queue_status", query.queue_status);
  append(p, "min_waiting_hours", query.min_waiting_hours);
  append(p, "max_waiting_hours", query.max_waiting_hours);
  append(p, "only_degraded_services", query.only_degraded_services);
  append(p, "min_overdue_share", query.min_overdue_share);
  append(p, "limit", query.limit);
  return apiFetch<SlaSummary>(withQs(`${BASE}/review-sla/summary`, p));
}

export function getOfferDetailCard(id: number): Promise<ApiFetchResult<OfferDetailCard>> {
  return apiFetch<OfferDetailCard>(`${BASE}/${id}/detail-card`);
}

export function getServiceHealth(query: { limit?: number; service_id?: number; only_degraded?: boolean } = {}): Promise<ApiFetchResult<ServiceHealthResponse>> {
  const p = new URLSearchParams();
  append(p, "limit", query.limit);
  append(p, "service_id", query.service_id);
  append(p, "only_degraded", query.only_degraded);
  return apiFetch<ServiceHealthResponse>(withQs(`${BASE}/review-sla/health`, p));
}

export function getProviderHealth(query: { limit?: number; provider_id?: number; only_degraded?: boolean } = {}): Promise<ApiFetchResult<ProviderHealthResponse>> {
  const p = new URLSearchParams();
  append(p, "limit", query.limit);
  append(p, "provider_id", query.provider_id);
  append(p, "only_degraded", query.only_degraded);
  return apiFetch<ProviderHealthResponse>(withQs(`${BASE}/review-sla/providers/health`, p));
}

export function getDispatchRuns(query: DispatchRunsQuery = {}): Promise<ApiFetchResult<DispatchRunLogResponse>> {
  const p = new URLSearchParams();
  append(p, "dispatch_scope", query.dispatch_scope);
  append(p, "status", query.status);
  append(p, "actor_admin_id", query.actor_admin_id);
  append(p, "idempotency_key", query.idempotency_key);
  append(p, "limit", query.limit);
  append(p, "offset", query.offset);
  return apiFetch<DispatchRunLogResponse>(withQs(`${BASE}/review-sla/dispatch-runs`, p));
}

export function getDlq(query: DlqQuery = {}): Promise<ApiFetchResult<DlqResponse>> {
  const p = new URLSearchParams();
  append(p, "source_run_id", query.source_run_id);
  append(p, "channel", query.channel);
  append(p, "provider_id", query.provider_id);
  append(p, "exclude_replayed_successes", query.exclude_replayed_successes);
  append(p, "limit", query.limit);
  append(p, "offset", query.offset);
  return apiFetch<DlqResponse>(withQs(`${BASE}/review-sla/providers/dlq`, p));
}

export function approveOffer(id: number): Promise<ApiFetchResult<OfferModerationResponse>> {
  return apiFetch<OfferModerationResponse>(`${BASE}/${id}/approve`, {
    method: "POST",
    redirectOn401: false,
  });
}

export function rejectOffer(id: number, reason: string): Promise<ApiFetchResult<OfferModerationResponse>> {
  return apiFetch<OfferModerationResponse>(`${BASE}/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
    redirectOn401: false,
  });
}

export function archiveOffer(id: number, reason?: string): Promise<ApiFetchResult<OfferModerationResponse>> {
  return apiFetch<OfferModerationResponse>(`${BASE}/${id}/archive`, {
    method: "POST",
    body: JSON.stringify(reason ? { reason } : {}),
    redirectOn401: false,
  });
}

export function disableOffer(id: number, reason?: string): Promise<ApiFetchResult<OfferModerationResponse>> {
  return apiFetch<OfferModerationResponse>(`${BASE}/${id}/disable`, {
    method: "POST",
    body: JSON.stringify(reason ? { reason } : {}),
    redirectOn401: false,
  });
}

export function enableOffer(id: number): Promise<ApiFetchResult<OfferModerationResponse>> {
  return apiFetch<OfferModerationResponse>(`${BASE}/${id}/enable`, {
    method: "POST",
    redirectOn401: false,
  });
}

export function forceOfferDispatch(idempotencyKey: string): Promise<ApiFetchResult<OfferDispatchResponse>> {
  return apiFetch<OfferDispatchResponse>(`${BASE}/review-sla/dispatch`, {
    method: "POST",
    headers: { "X-Idempotency-Key": idempotencyKey },
    redirectOn401: false,
  });
}

export function forceProviderDispatch(idempotencyKey: string): Promise<ApiFetchResult<ProviderDispatchResponse>> {
  return apiFetch<ProviderDispatchResponse>(`${BASE}/review-sla/providers/dispatch`, {
    method: "POST",
    headers: { "X-Idempotency-Key": idempotencyKey },
    redirectOn401: false,
  });
}

export function replayDlq(body: DlqReplayRequest): Promise<ApiFetchResult<DlqReplayResponse>> {
  return apiFetch<DlqReplayResponse>(`${BASE}/review-sla/providers/dlq/replay`, {
    method: "POST",
    body: JSON.stringify(body),
    redirectOn401: false,
  });
}
