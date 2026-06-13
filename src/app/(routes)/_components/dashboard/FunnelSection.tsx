import type { FunnelResponse } from "@/lib/dashboard/types";

export default function FunnelSection({ data }: { data: FunnelResponse }) {
  if (!data) {
    return (
      <div className="text-sm text-zinc-500">No funnel data available</div>
    );
  }

  const { status_counts, failure_reasons } = data;

  return (
    <div data-testid="funnel-section" className="space-y-6">
      {/* Status Counts */}
      <div className="rounded border border-zinc-200 bg-surface-1 p-4">
        <h3 className="mb-4 text-sm font-semibold text-zinc-700">
          Booking Status Distribution
        </h3>
        {status_counts && status_counts.length > 0 ? (
          <div className="space-y-2">
            {status_counts.map((item) => {
              const maxCount = Math.max(
                ...status_counts.map((s) => s.count),
                1
              );
              const percentage = (item.count / maxCount) * 100;

              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700">
                      {item.status}
                    </span>
                    <span className="text-zinc-500">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 rounded bg-zinc-200">
                    <div
                      className="h-full rounded bg-blue-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-zinc-400">No status data</div>
        )}
      </div>

      {/* Failure Reasons */}
      <div className="rounded border border-zinc-200 bg-surface-1 p-4">
        <h3 className="mb-4 text-sm font-semibold text-zinc-700">
          Failure Reasons
        </h3>
        {failure_reasons && failure_reasons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">
                    Code
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-600">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {failure_reasons.map((item) => (
                  <tr
                    key={item.failure_code}
                    className="border-b border-zinc-100 hover:bg-zinc-50"
                  >
                    <td className="px-3 py-2 font-mono text-zinc-700">
                      {item.failure_code}
                    </td>
                    <td className="px-3 py-2 text-right text-zinc-600">
                      {item.count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-xs text-zinc-400">No failure reasons recorded</div>
        )}
      </div>
    </div>
  );
}
