import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  ServiceDetail,
  ServiceListQuery,
  ServiceListResponse,
  ServiceSummary,
} from "./types";

const BASE = "/admin/v2/services";

function buildListPath(query: ServiceListQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.page_size) params.set("page_size", String(query.page_size));
  const qs = params.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

export function listServices(
  query: ServiceListQuery = {},
): Promise<ApiFetchResult<ServiceListResponse>> {
  return apiFetch<ServiceListResponse>(buildListPath(query));
}

export function getService(id: string): Promise<ApiFetchResult<ServiceDetail>> {
  return apiFetch<ServiceDetail>(`${BASE}/${encodeURIComponent(id)}`);
}

type MutationOpts = { reason?: string };

function moderationCall(
  id: string,
  action: "approve" | "reject" | "request-changes" | "hide" | "restore",
  opts: MutationOpts = {},
): Promise<ApiFetchResult<ServiceSummary>> {
  return apiFetch<ServiceSummary>(
    `${BASE}/${encodeURIComponent(id)}/${action}`,
    {
      method: "POST",
      body: opts.reason ? JSON.stringify({ reason: opts.reason }) : undefined,
      redirectOn401: false,
    },
  );
}

export const approveService = (id: string) => moderationCall(id, "approve");
export const rejectService = (id: string, reason: string) =>
  moderationCall(id, "reject", { reason });
export const requestChangesService = (id: string, reason: string) =>
  moderationCall(id, "request-changes", { reason });
export const hideService = (id: string) => moderationCall(id, "hide");
export const restoreService = (id: string) => moderationCall(id, "restore");
