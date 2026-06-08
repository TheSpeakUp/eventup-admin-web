import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  ProviderCursorPage,
  ProviderDetail,
  ProviderListQuery,
  ProviderModerationResponse,
  ProviderStats,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace/providers";

function buildListPath(query: ProviderListQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.last_id !== undefined) params.set("last_id", String(query.last_id));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  const qs = params.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

export function listProviders(
  query: ProviderListQuery = {},
): Promise<ApiFetchResult<ProviderCursorPage>> {
  return apiFetch<ProviderCursorPage>(buildListPath(query));
}

export function getProvider(
  id: number,
): Promise<ApiFetchResult<ProviderDetail>> {
  return apiFetch<ProviderDetail>(`${BASE}/${id}`);
}

export function getProviderStats(
  id: number,
): Promise<ApiFetchResult<ProviderStats>> {
  return apiFetch<ProviderStats>(`${BASE}/${id}/stats`);
}

export function verifyProvider(
  id: number,
  message?: string,
): Promise<ApiFetchResult<ProviderModerationResponse>> {
  return apiFetch<ProviderModerationResponse>(`${BASE}/${id}/verify`, {
    method: "POST",
    body: JSON.stringify(message ? { message } : {}),
    redirectOn401: false,
  });
}

export function blockProvider(
  id: number,
  reason: string,
): Promise<ApiFetchResult<ProviderModerationResponse>> {
  return apiFetch<ProviderModerationResponse>(`${BASE}/${id}/block`, {
    method: "POST",
    body: JSON.stringify({ reason }),
    redirectOn401: false,
  });
}

export function unblockProvider(
  id: number,
): Promise<ApiFetchResult<ProviderModerationResponse>> {
  return apiFetch<ProviderModerationResponse>(`${BASE}/${id}/unblock`, {
    method: "POST",
    redirectOn401: false,
  });
}

export function deleteProvider(
  id: number,
): Promise<ApiFetchResult<ProviderModerationResponse>> {
  return apiFetch<ProviderModerationResponse>(`${BASE}/${id}`, {
    method: "DELETE",
    redirectOn401: false,
  });
}
