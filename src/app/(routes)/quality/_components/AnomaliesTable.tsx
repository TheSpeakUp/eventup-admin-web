// src/app/(routes)/quality/_components/AnomaliesTable.tsx
// Anti-gaming anomaly events list. "Reviewed" == resolved_at set. SUPERADMIN
// gets a Review control on unreviewed rows; non-SUPERADMIN sees none.
import type { AnomalyEventRead } from "@/lib/quality/types";
import Badge from "@/app/_components/ui/Badge";
import EmptyState from "@/app/_components/ui/EmptyState";
import { Table, THead, TBody, Tr, Th, Td } from "@/app/_components/ui/Table";
import SeverityBadge from "./SeverityBadge";
import ReviewAnomalyButton from "./ReviewAnomalyButton";

export default function AnomaliesTable({
  rows,
  canManage,
}: {
  rows: AnomalyEventRead[];
  canManage: boolean;
}) {
  if (rows.length === 0)
    return <EmptyState testid="anomalies-empty">No anomaly events.</EmptyState>;
  return (
    <div data-testid="anomalies-table">
    <Table>
      <THead>
        <Tr>
          <Th>Event</Th>
          <Th>Service</Th>
          <Th>Provider</Th>
          <Th>Type</Th>
          <Th>Severity</Th>
          <Th>Coefficient</Th>
          <Th>Reviewed</Th>
          <Th />
        </Tr>
      </THead>
      <TBody>
        {rows.map((r) => {
          const reviewed = r.resolved_at !== null;
          return (
            <Tr key={r.id} data-testid={`anomaly-row-${r.id}`}>
              <Td className="font-mono text-xs">#{r.id}</Td>
              <Td>{r.service_id}</Td>
              <Td>{r.provider_id}</Td>
              <Td className="text-ink-subtle">{r.event_type}</Td>
              <Td>
                <SeverityBadge severity={r.severity} />
              </Td>
              <Td>{r.coefficient.toFixed(2)}</Td>
              <Td data-testid={`anomaly-reviewed-${r.id}`}>
                {reviewed ? (
                  <Badge tone="success">Reviewed</Badge>
                ) : (
                  <Badge tone="warning">Pending</Badge>
                )}
              </Td>
              <Td className="whitespace-nowrap">
                {canManage && !reviewed ? (
                  <ReviewAnomalyButton id={r.id} />
                ) : null}
              </Td>
            </Tr>
          );
        })}
      </TBody>
    </Table>
    </div>
  );
}
