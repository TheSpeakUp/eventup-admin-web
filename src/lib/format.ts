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
