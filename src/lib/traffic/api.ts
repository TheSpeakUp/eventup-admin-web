// src/lib/traffic/api.ts
import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  AdminAnalyticsSummary,
  AdminListingDetail,
  AdminTopListings,
  AnalyticsWindow,
  ListingType,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace/analytics";

function windowQs(params: URLSearchParams, win: AnalyticsWindow): void {
  if (win.date_from) params.set("date_from", win.date_from);
  if (win.date_to) params.set("date_to", win.date_to);
}

export function getAnalyticsSummary(
  win: AnalyticsWindow = {},
): Promise<ApiFetchResult<AdminAnalyticsSummary>> {
  const p = new URLSearchParams();
  windowQs(p, win);
  const qs = p.toString();
  return apiFetch<AdminAnalyticsSummary>(`${BASE}/summary${qs ? `?${qs}` : ""}`);
}

export function getTopListings(
  type: ListingType,
  win: AnalyticsWindow = {},
  limit = 20,
): Promise<ApiFetchResult<AdminTopListings>> {
  const p = new URLSearchParams();
  p.set("type", type);
  p.set("limit", String(limit));
  windowQs(p, win);
  return apiFetch<AdminTopListings>(`${BASE}/top-listings?${p.toString()}`);
}

export function getListingDetail(
  type: ListingType,
  subjectId: number,
  win: AnalyticsWindow = {},
): Promise<ApiFetchResult<AdminListingDetail>> {
  const p = new URLSearchParams();
  windowQs(p, win);
  const qs = p.toString();
  return apiFetch<AdminListingDetail>(
    `${BASE}/listings/${type}/${subjectId}${qs ? `?${qs}` : ""}`,
  );
}
