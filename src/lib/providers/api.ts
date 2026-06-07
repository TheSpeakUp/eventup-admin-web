import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  ProviderDetail,
  ProviderListQuery,
  ProviderListResponse,
  ProviderSummary,
} from "./types";

const BASE = "/admin/v2/providers";

function buildListPath(query: ProviderListQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.page_size) params.set("page_size", String(query.page_size));
  const qs = params.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

export function listProviders(
  query: ProviderListQuery = {},
): Promise<ApiFetchResult<ProviderListResponse>> {
  return apiFetch<ProviderListResponse>(buildListPath(query));
}

export function getProvider(id: string): Promise<ApiFetchResult<ProviderDetail>> {
  return apiFetch<ProviderDetail>(`${BASE}/${encodeURIComponent(id)}`);
}

type MutationOpts = { reason?: string };

function moderationCall(
  id: string,
  action: "approve" | "reject" | "suspend" | "restore",
  opts: MutationOpts = {},
): Promise<ApiFetchResult<ProviderSummary>> {
  return apiFetch<ProviderSummary>(
    `${BASE}/${encodeURIComponent(id)}/${action}`,
    {
      method: "POST",
      body: opts.reason ? JSON.stringify({ reason: opts.reason }) : undefined,
      redirectOn401: false,
    },
  );
}

export const approveProvider = (id: string) => moderationCall(id, "approve");
export const rejectProvider = (id: string, reason: string) =>
  moderationCall(id, "reject", { reason });
export const suspendProvider = (id: string, reason: string) =>
  moderationCall(id, "suspend", { reason });
export const restoreProvider = (id: string) => moderationCall(id, "restore");
