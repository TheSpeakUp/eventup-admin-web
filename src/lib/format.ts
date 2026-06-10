/**
 * Shared display formatters for admin views.
 *
 * Backend timestamps arrive as ISO strings, sometimes with microsecond
 * precision and no timezone suffix (e.g. "2026-06-09T06:40:00.918545").
 * Render them as a compact "YYYY-MM-DD HH:MM" wall-clock value rather than
 * leaking the raw ISO string into operator-facing tables.
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toISOString().slice(0, 16).replace("T", " ");
}

// Currencies the backend never charges in fractional minor units. Anything not
// listed here uses the ISO-4217 default of 2 decimal places (×100). This list
// covers the zero-decimal currencies likely to appear in marketplace charges;
// fall back gracefully (no crash) for anything unexpected.
const ZERO_DECIMAL_CURRENCIES = new Set([
  "JPY",
  "KRW",
  "VND",
  "CLP",
  "ISK",
  "XOF",
  "XAF",
  "BIF",
  "DJF",
  "GNF",
  "KMF",
  "PYG",
  "RWF",
  "UGX",
  "VUV",
  "XPF",
]);

export function minorUnitExponent(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2;
}

/**
 * Render an integer minor-unit amount + ISO currency as a localized money
 * string, e.g. (12345, "USD") → "$123.45", (5000, "JPY") → "¥5,000".
 *
 * `amount_minor` arrives as an integer number of the currency's smallest unit
 * (cents for USD/EUR, whole yen for JPY). We divide by the currency's exponent
 * and hand the major-unit value to Intl. A null amount renders as the em-dash
 * placeholder used elsewhere in the admin tables.
 */
export function formatMoneyMinor(
  amountMinor: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (amountMinor === null || amountMinor === undefined) return "—";
  const code = (currency ?? "USD").toUpperCase();
  const exponent = minorUnitExponent(code);
  const major = amountMinor / 10 ** exponent;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(major);
  } catch {
    // Unknown / malformed currency code — Intl throws on an invalid ISO code.
    // Degrade to a plain "<amount> <code>" rather than blanking the cell.
    return `${major.toFixed(exponent)} ${code}`;
  }
}
