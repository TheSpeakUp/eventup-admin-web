// Dashboard-specific display formatters.
//
// Backend time buckets arrive as ISO strings ("2026-06-08T00:00:00Z"). Never
// render those raw on an axis — format per granularity to a short human label.

import { minorUnitExponent } from "@/lib/format";
import type { Granularity } from "./types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Format an ISO bucket boundary into a compact axis label scaled to the
 * granularity: day/week → "Jun 8", month → "Jun 2026" (year only when it adds
 * information), falling back to the raw string if it can't be parsed.
 */
export function formatAxisDate(
  iso: string,
  granularity: Granularity,
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getUTCDate();
  const month = MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  if (granularity === "month") return `${month} ${year}`;
  return `${month} ${day}`;
}

/**
 * Compact money for hero values and axes: ($, 5817_00) → "$5.8K".
 * Keeps the currency symbol; uses Intl compact notation.
 */
export function formatCompactMoney(
  amountMinor: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (amountMinor === null || amountMinor === undefined) return "—";
  const code = (currency ?? "USD").toUpperCase();
  const major = amountMinor / 10 ** minorUnitExponent(code);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(major);
  } catch {
    return `${Math.round(major).toLocaleString()} ${code}`;
  }
}

/** Compact integer: 1234 → "1.2K". */
export function formatCompactNumber(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/** Signed percentage-point or percent label: 12.43 → "12.4%". */
export function formatPct(pct: number): string {
  return `${pct.toFixed(1)}%`;
}
