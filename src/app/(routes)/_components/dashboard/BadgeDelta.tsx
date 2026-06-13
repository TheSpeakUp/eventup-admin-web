import type { Delta } from "@/lib/dashboard/metrics";
import { formatPct } from "@/lib/dashboard/format";

/**
 * Period-over-period change pill: arrow + percent, colored by whether the move
 * is *good* or *bad* — not merely up or down. For most metrics up is good; pass
 * `invert` for metrics where up is bad (failed-payment rate, refund rate).
 */
export default function BadgeDelta({
  delta,
  invert = false,
  className = "",
}: {
  delta: Delta;
  invert?: boolean;
  className?: string;
}) {
  const { direction, pct } = delta;

  if (direction === "flat") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-subtle ${className}`}
      >
        <span aria-hidden>→</span>
        {pct === null ? "—" : formatPct(0)}
      </span>
    );
  }

  const isGood = invert ? direction === "down" : direction === "up";
  const tone = isGood
    ? "bg-emerald-500/10 text-emerald-400"
    : "bg-red-500/10 text-red-400";
  const arrow = direction === "up" ? "↑" : "↓";
  const label = pct === null ? "new" : formatPct(Math.abs(pct));

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tone} ${className}`}
    >
      <span aria-hidden>{arrow}</span>
      {label}
    </span>
  );
}
