import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import type { AuditEventListItem } from "@/lib/audit/types";
import AuditOutcomeBadge from "./AuditOutcomeBadge";

function entityRef(row: AuditEventListItem): string {
  if (!row.entity_type && !row.entity_id) return "—";
  if (row.entity_type && row.entity_id)
    return `${row.entity_type} #${row.entity_id}`;
  return row.entity_type ?? `#${row.entity_id}`;
}

export default function AuditTable({ rows }: { rows: AuditEventListItem[] }) {
  if (rows.length === 0) {
    return (
      <div
        data-testid="audit-empty"
        className="rounded-md border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500"
      >
        No audit events match the current filters.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 bg-surface-1">
      <table
        className="min-w-full divide-y divide-zinc-200 text-sm"
        data-testid="audit-table"
      >
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Time</th>
            <th className="px-4 py-2.5 text-left font-medium">Actor</th>
            <th className="px-4 py-2.5 text-left font-medium">Action</th>
            <th className="px-4 py-2.5 text-left font-medium">Entity</th>
            <th className="px-4 py-2.5 text-left font-medium">Outcome</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <tr
              key={row.id}
              data-testid={`audit-row-${row.id}`}
              className="hover:bg-zinc-50"
            >
              <td className="px-4 py-2.5 text-zinc-500">
                <Link
                  href={`/audit/${row.id}`}
                  className="text-zinc-900 hover:text-zinc-700 hover:underline"
                  data-testid={`audit-row-link-${row.id}`}
                >
                  {formatDateTime(row.occurred_at)}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-zinc-700">
                {row.actor_email ?? "—"}
              </td>
              <td className="px-4 py-2.5">
                <span className="font-mono text-xs text-zinc-900">
                  {row.action}
                </span>
              </td>
              <td className="px-4 py-2.5 text-zinc-700">{entityRef(row)}</td>
              <td className="px-4 py-2.5">
                <AuditOutcomeBadge outcome={row.outcome} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
