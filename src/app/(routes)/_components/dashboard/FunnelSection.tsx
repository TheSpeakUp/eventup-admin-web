import type { FunnelResponse } from "@/lib/dashboard/types";

// Semantic status coloring: success green, terminal-failure red, expiry amber,
// everything else neutral lavender. Keeps color meaningful, not decorative.
function statusColor(status: string): string {
  const k = status.toLowerCase();
  if (["succeeded", "success", "completed"].includes(k)) return "bg-emerald-500";
  if (["failed", "failure", "declined", "error"].includes(k)) return "bg-red-500";
  if (["expired", "cancelled", "canceled"].includes(k)) return "bg-amber-500";
  return "bg-primary";
}

export default function FunnelSection({ data }: { data: FunnelResponse }) {
  if (!data) {
    return <div className="text-sm text-ink-subtle">No funnel data available</div>;
  }

  const { status_counts, failure_reasons } = data;
  const total = status_counts.reduce((s, x) => s + x.count, 0) || 1;
  const sorted = [...status_counts].sort((a, b) => b.count - a.count);
  const topFailure = [...failure_reasons].sort((a, b) => b.count - a.count)[0];

  return (
    <div data-testid="funnel-section" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-hairline bg-surface-1 p-4">
        <h3 className="mb-4 text-sm font-medium text-ink">Booking status distribution</h3>
        {sorted.length > 0 ? (
          <div className="space-y-3">
            {sorted.map((item) => {
              const pct = (item.count / total) * 100;
              return (
                <div key={item.status}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="capitalize text-ink-muted">{item.status}</span>
                    <span className="tabular-nums text-ink-subtle">
                      <span className="font-medium text-ink">
                        {item.count.toLocaleString()}
                      </span>{" "}
                      · {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={`h-full rounded-full ${statusColor(item.status)}`}
                      style={{ width: `${Math.max(pct, 1.5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-ink-subtle">No status data</div>
        )}
      </div>

      <div className="rounded-lg border border-hairline bg-surface-1 p-4">
        <h3 className="mb-4 text-sm font-medium text-ink">Failure reasons</h3>
        {failure_reasons.length > 0 ? (
          <>
            <div className="space-y-2">
              {failure_reasons
                .slice()
                .sort((a, b) => b.count - a.count)
                .map((item) => (
                  <div
                    key={item.failure_code}
                    className="flex items-center justify-between border-b border-hairline/60 py-1.5 text-xs last:border-0"
                  >
                    <span className="font-mono text-ink-muted">{item.failure_code}</span>
                    <span className="tabular-nums font-medium text-ink">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
            {topFailure ? (
              <div className="mt-3 border-t border-hairline pt-3 text-xs text-ink-subtle">
                Top failure:{" "}
                <span className="font-mono text-ink">{topFailure.failure_code}</span> (
                {topFailure.count})
              </div>
            ) : null}
          </>
        ) : (
          <div className="text-xs text-ink-subtle">No failure reasons recorded</div>
        )}
      </div>
    </div>
  );
}
