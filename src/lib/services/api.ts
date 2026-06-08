import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  ServiceCursorPage,
  ServiceDetail,
  ServiceListQuery,
  ServiceModerationResponse,
  ServiceStats,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace/services";

function buildListPath(query: ServiceListQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.provider_id !== undefined)
    params.set("provider_id", String(query.provider_id));
  if (query.last_id !== undefined) params.set("last_id", String(query.last_id));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  const qs = params.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

export function listServices(
  query: ServiceListQuery = {},
): Promise<ApiFetchResult<ServiceCursorPage>> {
  return apiFetch<ServiceCursorPage>(buildListPath(query));
}

export function getService(id: number): Promise<ApiFetchResult<ServiceDetail>> {
  return apiFetch<ServiceDetail>(`${BASE}/${id}`);
}

export function getServiceStats(
  id: number,
): Promise<ApiFetchResult<ServiceStats>> {
  return apiFetch<ServiceStats>(`${BASE}/${id}/stats`);
}

export function approveService(
  id: number,
): Promise<ApiFetchResult<ServiceModerationResponse>> {
  return apiFetch<ServiceModerationResponse>(`${BASE}/${id}/approve`, {
    method: "POST",
    redirectOn401: false,
  });
}

export function rejectService(
  id: number,
  reason: string,
  comment?: string,
): Promise<ApiFetchResult<ServiceModerationResponse>> {
  return apiFetch<ServiceModerationResponse>(`${BASE}/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason, ...(comment ? { comment } : {}) }),
    redirectOn401: false,
  });
}

export function unpublishService(
  id: number,
  reason?: string,
): Promise<ApiFetchResult<ServiceModerationResponse>> {
  const qs = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  return apiFetch<ServiceModerationResponse>(`${BASE}/${id}/unpublish${qs}`, {
    method: "POST",
    redirectOn401: false,
  });
}

export function republishService(
  id: number,
): Promise<ApiFetchResult<ServiceModerationResponse>> {
  return apiFetch<ServiceModerationResponse>(`${BASE}/${id}/republish`, {
    method: "POST",
    redirectOn401: false,
  });
}

export function archiveService(
  id: number,
  reason?: string,
): Promise<ApiFetchResult<ServiceModerationResponse>> {
  const qs = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  return apiFetch<ServiceModerationResponse>(`${BASE}/${id}/archive${qs}`, {
    method: "POST",
    redirectOn401: false,
  });
}
