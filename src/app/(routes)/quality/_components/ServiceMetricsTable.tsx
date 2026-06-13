// src/app/(routes)/quality/_components/ServiceMetricsTable.tsx
// Service quality metrics list. Each row links to the detail route
// (GET /quality/services/{id}) where the metric breakdown + override controls
// live. An "Override" badge flags rows with an active manual override.
import Link from "next/link";
import type { ServiceQualityMetricRead } from "@/lib/quality/types";
import TierBadge from "./TierBadge";

export default function ServiceMetricsTable({
  rows,
}: {
  rows: ServiceQualityMetricRead[];
}) {
  if (rows.length === 0)
    return (
      <p data-testid="service-metrics-empty" className="p-4 text-zinc-500">
        No service quality metrics yet.
      </p>
    );
  return (
    <table className="w-full text-sm" data-testid="service-metrics-table">
      <thead>
        <tr className="text-left text-zinc-500">
          <th className="py-2">Service</th>
          <th>Provider</th>
          <th>Tier</th>
          <th>Ranking</th>
          <th>Trust</th>
          <th>Anomaly</th>
          <th>Override</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.service_id}
            className="border-t border-zinc-200"
            data-testid={`service-metric-row-${r.service_id}`}
          >
            <td className="py-2 font-mono text-xs">#{r.service_id}</td>
            <td>{r.provider_id}</td>
            <td>
              <TierBadge tier={r.quality_tier} />
            </td>
            <td>{r.ranking_score.toFixed(2)}</td>
            <td>{r.trust_score.toFixed(2)}</td>
            <td>{r.anomaly_score.toFixed(2)}</td>
            <td data-testid={`service-metric-override-${r.service_id}`}>
              {r.manual_override_coefficient !== null ? (
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 ring-1 ring-inset ring-purple-200">
                  ×{r.manual_override_coefficient}
                </span>
              ) : (
                <span className="text-zinc-400">—</span>
              )}
            </td>
            <td className="whitespace-nowrap">
              <Link
                href={`/quality/services/${r.service_id}`}
                data-testid={`service-metric-view-${r.service_id}`}
                className="text-primary-hover"
              >
                View
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
