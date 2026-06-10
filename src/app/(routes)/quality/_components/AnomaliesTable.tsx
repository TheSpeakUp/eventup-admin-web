// src/app/(routes)/quality/_components/AnomaliesTable.tsx
// Anti-gaming anomaly events list. "Reviewed" == resolved_at set. SUPERADMIN
// gets a Review control on unreviewed rows; non-SUPERADMIN sees none.
import type { AnomalyEventRead } from "@/lib/quality/types";
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
    return (
      <p data-testid="anomalies-empty" className="p-4 text-zinc-500">
        No anomaly events.
      </p>
    );
  return (
    <table className="w-full text-sm" data-testid="anomalies-table">
      <thead>
        <tr className="text-left text-zinc-500">
          <th className="py-2">Event</th>
          <th>Service</th>
          <th>Provider</th>
          <th>Type</th>
          <th>Severity</th>
          <th>Coefficient</th>
          <th>Reviewed</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const reviewed = r.resolved_at !== null;
          return (
            <tr
              key={r.id}
              className="border-t border-zinc-200"
              data-testid={`anomaly-row-${r.id}`}
            >
              <td className="py-2 font-mono text-xs">#{r.id}</td>
              <td>{r.service_id}</td>
              <td>{r.provider_id}</td>
              <td className="text-zinc-600">{r.event_type}</td>
              <td>
                <SeverityBadge severity={r.severity} />
              </td>
              <td>{r.coefficient.toFixed(2)}</td>
              <td data-testid={`anomaly-reviewed-${r.id}`}>
                {reviewed ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
                    Reviewed
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                    Pending
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap">
                {canManage && !reviewed ? (
                  <ReviewAnomalyButton id={r.id} />
                ) : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
