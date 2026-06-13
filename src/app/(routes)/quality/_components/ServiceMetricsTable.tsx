// src/app/(routes)/quality/_components/ServiceMetricsTable.tsx
// Service quality metrics list. Each row links to the detail route
// (GET /quality/services/{id}) where the metric breakdown + override controls
// live. An "Override" badge flags rows with an active manual override.
import Link from "next/link";
import type { ServiceQualityMetricRead } from "@/lib/quality/types";
import Badge from "@/app/_components/ui/Badge";
import EmptyState from "@/app/_components/ui/EmptyState";
import { Table, THead, TBody, Tr, Th, Td } from "@/app/_components/ui/Table";
import TierBadge from "./TierBadge";

export default function ServiceMetricsTable({
  rows,
}: {
  rows: ServiceQualityMetricRead[];
}) {
  if (rows.length === 0)
    return (
      <EmptyState testid="service-metrics-empty">
        No service quality metrics yet.
      </EmptyState>
    );
  return (
    <div data-testid="service-metrics-table">
    <Table>
      <THead>
        <Tr>
          <Th>Service</Th>
          <Th>Provider</Th>
          <Th>Tier</Th>
          <Th>Ranking</Th>
          <Th>Trust</Th>
          <Th>Anomaly</Th>
          <Th>Override</Th>
          <Th />
        </Tr>
      </THead>
      <TBody>
        {rows.map((r) => (
          <Tr key={r.service_id} data-testid={`service-metric-row-${r.service_id}`}>
            <Td className="font-mono text-xs">#{r.service_id}</Td>
            <Td>{r.provider_id}</Td>
            <Td>
              <TierBadge tier={r.quality_tier} />
            </Td>
            <Td>{r.ranking_score.toFixed(2)}</Td>
            <Td>{r.trust_score.toFixed(2)}</Td>
            <Td>{r.anomaly_score.toFixed(2)}</Td>
            <Td data-testid={`service-metric-override-${r.service_id}`}>
              {r.manual_override_coefficient !== null ? (
                <Badge tone="info">×{r.manual_override_coefficient}</Badge>
              ) : (
                <span className="text-ink-tertiary">—</span>
              )}
            </Td>
            <Td className="whitespace-nowrap">
              <Link
                href={`/quality/services/${r.service_id}`}
                data-testid={`service-metric-view-${r.service_id}`}
                className="text-primary-hover hover:underline"
              >
                View
              </Link>
            </Td>
          </Tr>
        ))}
      </TBody>
    </Table>
    </div>
  );
}
