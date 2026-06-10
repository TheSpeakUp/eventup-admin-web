// src/mocks/traffic-fixtures.ts
// Deterministic M2 analytics fixtures. Read-only surface — no store/Map needed,
// just pure builders the handlers compute from. Fixed date window so Playwright
// assertions are stable.
import type {
  AdminAnalyticsSummary,
  AdminListingDetail,
  AdminTopListings,
  AnalyticsTrendPoint,
  ListingStat,
} from "@/lib/traffic/types";

const ANCHOR = "2026-06-10";
const WINDOW_DAYS = 14;

function shiftDate(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

export const DEFAULT_FROM = shiftDate(ANCHOR, -(WINDOW_DAYS - 1));
export const DEFAULT_TO = ANCHOR;

function ratio(views: number, clicks: number): number {
  return views === 0 ? 0 : Number((clicks / views).toFixed(4));
}

function buildSeries(
  from: string,
  to: string,
  baseViews: number,
  ctr: number,
): AnalyticsTrendPoint[] {
  const out: AnalyticsTrendPoint[] = [];
  let cursor = from;
  let i = 0;
  // Cap the loop so a malformed window can't spin forever.
  while (cursor <= to && i < 120) {
    const views = baseViews + ((i * 37) % 50);
    const clicks = Math.round(views * ctr);
    out.push({ date: cursor, views, clicks });
    cursor = shiftDate(cursor, 1);
    i += 1;
  }
  return out;
}

export function buildSummary(from: string, to: string): AdminAnalyticsSummary {
  const series = buildSeries(from, to, 120, 0.18);
  const total_views = series.reduce((a, p) => a + p.views, 0);
  const total_clicks = series.reduce((a, p) => a + p.clicks, 0);
  return {
    date_from: from,
    date_to: to,
    total_views,
    total_clicks,
    ctr: ratio(total_views, total_clicks),
    series,
  };
}

const PROVIDERS = [
  "Blackbird Studios",
  "Aurora Events",
  "Northwind Catering",
  "Lumière Decor",
  "Tempo Music",
];

function makeStat(
  type: string,
  i: number,
  views: number,
  ctr: number,
): ListingStat {
  const clicks = Math.round(views * ctr);
  return {
    subject_id: i,
    name: `${type === "service" ? "Service" : "Offer"} listing #${i}`,
    provider_name: PROVIDERS[i % PROVIDERS.length],
    views,
    clicks,
    ctr: ratio(views, clicks),
  };
}

export function buildTopListings(
  type: string,
  from: string,
  to: string,
  limit: number,
): AdminTopListings {
  // Top: descending views, healthy CTR.
  const top: ListingStat[] = [];
  for (let i = 1; i <= Math.min(limit, 10); i++) {
    top.push(makeStat(type, i, 2000 - i * 120, 0.2));
  }
  // Anti-top: high views, deliberately poor CTR.
  const anti_top: ListingStat[] = [];
  for (let i = 1; i <= Math.min(limit, 5); i++) {
    anti_top.push(makeStat(type, 100 + i, 1800 - i * 50, 0.02));
  }
  return { date_from: from, date_to: to, subject_type: type, top, anti_top };
}

// Known listing ids the detail endpoint serves; anything else → 404.
const KNOWN_IDS = new Set([1, 2, 3, 4, 5, 101, 102]);

export function buildListingDetail(
  type: string,
  subjectId: number,
  from: string,
  to: string,
): AdminListingDetail | null {
  if (!KNOWN_IDS.has(subjectId)) return null;
  const series = buildSeries(from, to, 60 + subjectId, 0.15);
  const total_views = series.reduce((a, p) => a + p.views, 0);
  const total_clicks = series.reduce((a, p) => a + p.clicks, 0);
  return {
    subject_type: type,
    subject_id: subjectId,
    date_from: from,
    date_to: to,
    total_views,
    total_clicks,
    ctr: ratio(total_views, total_clicks),
    series,
  };
}
