import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import type { RegistrySnapshot } from "@/lib/registry/types";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";

export function RegistrySnapshotsTable({
  rows,
}: {
  rows: RegistrySnapshot[];
}) {
  if (rows.length === 0) {
    return (
      <p
        data-testid="registry-empty"
        className="rounded border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500"
      >
        No registry snapshots match the current filters.
      </p>
    );
  }
  return (
    <Table data-testid="registry-table" className="border-collapse">
      <Thead>
        <tr>
          <Th>ID</Th>
          <Th>Entity</Th>
          <Th>Action</Th>
          <Th>Attribute key</Th>
          <Th>Actor</Th>
          <Th>When</Th>
          <Th></Th>
        </tr>
      </Thead>
      <Tbody>
        {rows.map((r) => (
          <Tr key={r.id} data-testid="registry-row" data-snapshot-id={r.id}>
            <Td className="font-mono text-xs">{r.id}</Td>
            <Td>{r.entity_type}</Td>
            <Td>{r.action}</Td>
            <Td className="font-mono text-xs">{r.attribute_key}</Td>
            <Td className="text-zinc-600">{r.actor_display_name ?? "—"}</Td>
            <Td className="text-zinc-500">{formatDateTime(r.created_at)}</Td>
            <Td>
              <Link
                href={`/registry/snapshots/${r.id}`}
                data-testid="registry-row-view"
                className="text-primary-hover hover:underline"
              >
                View
              </Link>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
