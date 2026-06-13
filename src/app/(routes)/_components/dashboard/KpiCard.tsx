import type { Delta, SeriesPoint } from "@/lib/dashboard/metrics";
import BadgeDelta from "./BadgeDelta";
import Sparkline from "./Sparkline";

/**
 * Enterprise KPI card: label · value · period-over-period delta · optional
 * sparkline. The `hero` variant scales the value up for the headline metric
 * (top-left of the dashboard, per the F-pattern reading order).
 */
export default function KpiCard({
  label,
  value,
  delta,
  invertDelta = false,
  comparisonLabel,
  deltaAbsLabel,
  sparkData,
  sparkColor,
  hero = false,
  testid,
}: {
  label: string;
  value: string;
  delta?: Delta | null;
  invertDelta?: boolean;
  comparisonLabel?: string;
  deltaAbsLabel?: string;
  sparkData?: SeriesPoint[];
  sparkColor?: string;
  hero?: boolean;
  testid: string;
}) {
  return (
    <div
      data-testid={testid}
      className="flex flex-col rounded-lg border border-hairline bg-surface-1 px-5 py-4 transition-colors hover:border-hairline-strong"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          {label}
        </span>
        {delta ? <BadgeDelta delta={delta} invert={invertDelta} /> : null}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={`font-semibold tabular-nums tracking-tight text-ink ${
            hero ? "text-4xl" : "text-2xl"
          }`}
        >
          {value}
        </span>
        {deltaAbsLabel ? (
          <span className="text-xs text-ink-tertiary">{deltaAbsLabel}</span>
        ) : null}
      </div>

      {comparisonLabel ? (
        <span className="mt-0.5 text-xs text-ink-tertiary">{comparisonLabel}</span>
      ) : null}

      {sparkData && sparkData.length >= 2 ? (
        <div className="mt-2">
          <Sparkline data={sparkData} color={sparkColor} height={hero ? 40 : 32} />
        </div>
      ) : null}
    </div>
  );
}
