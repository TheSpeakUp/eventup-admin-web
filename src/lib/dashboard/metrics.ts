// Aggregation + period-over-period delta helpers for the operator dashboard.
//
// The backend returns only the selected window. To show "vs previous period"
// deltas we fetch the immediately-preceding window of equal length and diff the
// aggregates here.

import type {
  ContentGrowthResponse,
  FunnelResponse,
  RevenueResponse,
} from "./types";

export type Delta = {
  /** previous-period absolute value (for "+N" labels) */
  previous: number;
  absolute: number;
  /** percent change vs previous; null when previous is 0 (undefined growth) */
  pct: number | null;
  direction: "up" | "down" | "flat";
};

/** A single point for a sparkline / trend series. */
export type SeriesPoint = { period: string; value: number };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The window of equal length immediately preceding [from, to].
 * Inputs/outputs are ISO datetime strings ("YYYY-MM-DDT00:00:00Z").
 * e.g. Jun 1 – Jun 30 → May 2 – May 31 (same span, ending the day before from).
 */
export function previousWindow(
  fromIso: string,
  toIso: string,
): { from: string; to: string } {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  const span = Math.max(to.getTime() - from.getTime(), DAY_MS);
  const prevTo = new Date(from.getTime() - DAY_MS);
  const prevFrom = new Date(prevTo.getTime() - span);
  return { from: prevFrom.toISOString(), to: prevTo.toISOString() };
}

export function computeDelta(current: number, previous: number): Delta {
  const absolute = current - previous;
  const pct = previous === 0 ? null : (absolute / previous) * 100;
  const direction = absolute > 0 ? "up" : absolute < 0 ? "down" : "flat";
  return { previous, absolute, pct, direction };
}

// ---- Revenue aggregation ---------------------------------------------------

/** Total gross (minor units) grouped by currency. */
export function revenueByCurrency(
  data: RevenueResponse | null,
): Map<string, { gross: number; payments: number }> {
  const map = new Map<string, { gross: number; payments: number }>();
  if (!data) return map;
  for (const b of data.buckets) {
    const e = map.get(b.currency) ?? { gross: 0, payments: 0 };
    e.gross += b.gross_minor;
    e.payments += b.payment_count;
    map.set(b.currency, e);
  }
  return map;
}

/** The currency with the largest gross — the headline currency for the hero. */
export function dominantCurrency(data: RevenueResponse | null): string | null {
  let best: string | null = null;
  let bestGross = -1;
  for (const [cur, e] of revenueByCurrency(data)) {
    if (e.gross > bestGross) {
      bestGross = e.gross;
      best = cur;
    }
  }
  return best;
}

export function totalPayments(data: RevenueResponse | null): number {
  if (!data) return 0;
  return data.buckets.reduce((s, b) => s + b.payment_count, 0);
}

/** Per-period gross series for one currency, sorted by period. */
export function revenueSeries(
  data: RevenueResponse | null,
  currency: string | null,
): SeriesPoint[] {
  if (!data || !currency) return [];
  const byPeriod = new Map<string, number>();
  for (const b of data.buckets) {
    if (b.currency !== currency) continue;
    byPeriod.set(b.period, (byPeriod.get(b.period) ?? 0) + b.gross_minor);
  }
  return [...byPeriod.entries()]
    .sort(([a], [z]) => a.localeCompare(z))
    .map(([period, value]) => ({ period, value }));
}

/** Per-period payment-count series, sorted by period. */
export function paymentSeries(data: RevenueResponse | null): SeriesPoint[] {
  if (!data) return [];
  const byPeriod = new Map<string, number>();
  for (const b of data.buckets) {
    byPeriod.set(b.period, (byPeriod.get(b.period) ?? 0) + b.payment_count);
  }
  return [...byPeriod.entries()]
    .sort(([a], [z]) => a.localeCompare(z))
    .map(([period, value]) => ({ period, value }));
}

// ---- Content growth aggregation -------------------------------------------

export function growthTotals(data: ContentGrowthResponse | null): {
  providers: number;
  services: number;
  offers: number;
} {
  const t = { providers: 0, services: 0, offers: 0 };
  if (!data) return t;
  for (const b of data.buckets) {
    t.providers += b.new_providers;
    t.services += b.new_services;
    t.offers += b.new_offers;
  }
  return t;
}

// ---- Funnel aggregation ----------------------------------------------------

const SUCCESS_STATUSES = new Set(["succeeded", "success", "completed"]);
const FAILURE_STATUSES = new Set(["failed", "failure", "declined", "error"]);

/**
 * Failed-payment rate = failed / (succeeded + failed), as a percent.
 * Returns null when there are no terminal (succeeded|failed) outcomes.
 */
export function failedRate(data: FunnelResponse | null): number | null {
  if (!data) return null;
  let succeeded = 0;
  let failed = 0;
  for (const s of data.status_counts) {
    const k = s.status.toLowerCase();
    if (SUCCESS_STATUSES.has(k)) succeeded += s.count;
    else if (FAILURE_STATUSES.has(k)) failed += s.count;
  }
  const terminal = succeeded + failed;
  if (terminal === 0) return null;
  return (failed / terminal) * 100;
}
