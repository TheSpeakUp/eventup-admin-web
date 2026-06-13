import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  ContentGrowthResponse,
  DashboardWindow,
  FunnelResponse,
  RevenueResponse,
  TopsResponse,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace/dashboard";

function append(
  params: URLSearchParams,
  key: string,
  value: string | number | boolean | undefined,
): void {
  if (value === undefined || value === null) return;
  params.set(key, String(value));
}

function withQs(path: string, params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function getDashboardRevenue(
  w: DashboardWindow,
): Promise<ApiFetchResult<RevenueResponse>> {
  const p = new URLSearchParams();
  append(p, "from", w.date_from);
  append(p, "to", w.date_to);
  append(p, "granularity", w.granularity);
  append(p, "currency", w.currency);
  return apiFetch<RevenueResponse>(withQs(`${BASE}/revenue`, p));
}

export function getDashboardFunnel(
  w: DashboardWindow,
): Promise<ApiFetchResult<FunnelResponse>> {
  const p = new URLSearchParams();
  append(p, "from", w.date_from);
  append(p, "to", w.date_to);
  return apiFetch<FunnelResponse>(withQs(`${BASE}/funnel`, p));
}

export function getDashboardContentGrowth(
  w: DashboardWindow,
): Promise<ApiFetchResult<ContentGrowthResponse>> {
  const p = new URLSearchParams();
  append(p, "from", w.date_from);
  append(p, "to", w.date_to);
  append(p, "granularity", w.granularity);
  return apiFetch<ContentGrowthResponse>(
    withQs(`${BASE}/content-growth`, p),
  );
}

export function getDashboardTops(
  w: DashboardWindow,
  limit?: number,
): Promise<ApiFetchResult<TopsResponse>> {
  const p = new URLSearchParams();
  append(p, "from", w.date_from);
  append(p, "to", w.date_to);
  append(p, "limit", limit);
  return apiFetch<TopsResponse>(withQs(`${BASE}/tops`, p));
}
