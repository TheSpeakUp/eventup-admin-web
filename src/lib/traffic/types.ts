// src/lib/traffic/types.ts
// Mirrors backend M2 analytics read slice
// (src/eventup/admin/marketplace/analytics_admin_schemas.py).

// top-listings `type` query + listing-detail path segment. Backend defaults to
// "service"; "offer" is the other operator-facing dimension.
export const LISTING_TYPES = ["service", "offer"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export function isListingType(value: string): value is ListingType {
  return (LISTING_TYPES as readonly string[]).includes(value);
}

export type AnalyticsTrendPoint = {
  date: string; // ISO date (YYYY-MM-DD)
  views: number;
  clicks: number;
};

export type AdminAnalyticsSummary = {
  date_from: string;
  date_to: string;
  total_views: number;
  total_clicks: number;
  ctr: number;
  series: AnalyticsTrendPoint[];
};

export type ListingStat = {
  subject_id: number;
  name: string | null;
  provider_name: string | null;
  views: number;
  clicks: number;
  ctr: number;
};

export type AdminTopListings = {
  date_from: string;
  date_to: string;
  subject_type: string;
  top: ListingStat[];
  anti_top: ListingStat[];
};

export type AdminListingDetail = {
  subject_type: string;
  subject_id: number;
  date_from: string;
  date_to: string;
  total_views: number;
  total_clicks: number;
  ctr: number;
  series: AnalyticsTrendPoint[];
};

export type AnalyticsWindow = {
  date_from?: string;
  date_to?: string;
};

// CTR arrives as a 0..1 fraction; render as a percentage.
export function formatCtr(ctr: number): string {
  return `${(ctr * 100).toFixed(1)}%`;
}

export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}
