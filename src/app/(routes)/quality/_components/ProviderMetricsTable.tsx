// src/app/(routes)/quality/_components/ProviderMetricsTable.tsx
// Provider quality metrics list (read-only — no detail route, no writes).
import type { ProviderQualityMetricRead } from "@/lib/quality/types";

export default function ProviderMetricsTable({
  rows,
}: {
  rows: ProviderQualityMetricRead[];
}) {
  if (rows.length === 0)
    return (
      <p data-testid="provider-metrics-empty" className="p-4 text-zinc-500">
        No provider quality metrics yet.
      </p>
    );
  return (
    <table className="w-full text-sm" data-testid="provider-metrics-table">
      <thead>
        <tr className="text-left text-zinc-500">
          <th className="py-2">Provider</th>
          <th>Trust</th>
          <th>Verification</th>
          <th>Rating</th>
          <th>Services</th>
          <th>Active</th>
          <th>Complaints</th>
          <th>SLA breaches</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.provider_id}
            className="border-t border-zinc-200"
            data-testid={`provider-metric-row-${r.provider_id}`}
          >
            <td className="py-2 font-mono text-xs">#{r.provider_id}</td>
            <td>{r.trust_score.toFixed(2)}</td>
            <td>{r.verification_score.toFixed(2)}</td>
            <td>{r.rating_score.toFixed(2)}</td>
            <td>{r.services_count}</td>
            <td>{r.active_services_count}</td>
            <td>{r.complaints_total}</td>
            <td>{r.sla_breaches}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
