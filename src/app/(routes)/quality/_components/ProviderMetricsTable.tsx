// src/app/(routes)/quality/_components/ProviderMetricsTable.tsx
// Provider quality metrics list (read-only — no detail route, no writes).
import type { ProviderQualityMetricRead } from "@/lib/quality/types";
import EmptyState from "@/app/_components/ui/EmptyState";
import { Table, THead, TBody, Tr, Th, Td } from "@/app/_components/ui/Table";

export default function ProviderMetricsTable({
  rows,
}: {
  rows: ProviderQualityMetricRead[];
}) {
  if (rows.length === 0)
    return (
      <EmptyState testid="provider-metrics-empty">
        No provider quality metrics yet.
      </EmptyState>
    );
  return (
    <div data-testid="provider-metrics-table">
    <Table>
      <THead>
        <Tr>
          <Th>Provider</Th>
          <Th>Trust</Th>
          <Th>Verification</Th>
          <Th>Rating</Th>
          <Th>Services</Th>
          <Th>Active</Th>
          <Th>Complaints</Th>
          <Th>SLA breaches</Th>
        </Tr>
      </THead>
      <TBody>
        {rows.map((r) => (
          <Tr key={r.provider_id} data-testid={`provider-metric-row-${r.provider_id}`}>
            <Td className="font-mono text-xs">#{r.provider_id}</Td>
            <Td>{r.trust_score.toFixed(2)}</Td>
            <Td>{r.verification_score.toFixed(2)}</Td>
            <Td>{r.rating_score.toFixed(2)}</Td>
            <Td>{r.services_count}</Td>
            <Td>{r.active_services_count}</Td>
            <Td>{r.complaints_total}</Td>
            <Td>{r.sla_breaches}</Td>
          </Tr>
        ))}
      </TBody>
    </Table>
    </div>
  );
}
