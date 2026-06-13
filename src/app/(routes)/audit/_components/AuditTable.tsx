import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import type { AuditEventListItem } from "@/lib/audit/types";
import AuditOutcomeBadge from "./AuditOutcomeBadge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";

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
    <div className="overflow-hidden">
      <Table className="min-w-full" data-testid="audit-table">
        <Thead>
          <tr>
            <Th>Time</Th>
            <Th>Actor</Th>
            <Th>Action</Th>
            <Th>Entity</Th>
            <Th>Outcome</Th>
          </tr>
        </Thead>
        <Tbody>
          {rows.map((row) => (
            <Tr key={row.id} data-testid={`audit-row-${row.id}`}>
              <Td className="text-zinc-500">
                <Link
                  href={`/audit/${row.id}`}
                  className="text-zinc-900 hover:text-zinc-700 hover:underline"
                  data-testid={`audit-row-link-${row.id}`}
                >
                  {formatDateTime(row.occurred_at)}
                </Link>
              </Td>
              <Td className="text-zinc-700">{row.actor_email ?? "—"}</Td>
              <Td>
                <span className="font-mono text-xs text-zinc-900">
                  {row.action}
                </span>
              </Td>
              <Td className="text-zinc-700">{entityRef(row)}</Td>
              <Td>
                <AuditOutcomeBadge outcome={row.outcome} />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  );
}
