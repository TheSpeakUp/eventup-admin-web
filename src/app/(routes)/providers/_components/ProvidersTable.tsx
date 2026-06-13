import Link from "next/link";
import type { ProviderListItem } from "@/lib/providers/types";
import StatusBadge from "./StatusBadge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export default function ProvidersTable({ rows }: { rows: ProviderListItem[] }) {
  if (rows.length === 0) {
    return (
      <div
        data-testid="providers-empty"
        className="rounded-md border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500"
      >
        No providers match the current search.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 bg-surface-1">
      <Table className="min-w-full" data-testid="providers-table">
        <Thead>
          <tr>
            <Th>Name</Th>
            <Th>Services</Th>
            <Th>Active offers</Th>
            <Th>Status</Th>
            <Th>Updated</Th>
          </tr>
        </Thead>
        <Tbody>
          {rows.map((row) => (
            <Tr key={row.id} data-testid={`providers-row-${row.id}`}>
              <Td>
                <Link
                  href={`/providers/${row.id}`}
                  className="text-zinc-900 hover:text-zinc-700 hover:underline"
                  data-testid={`providers-row-link-${row.id}`}
                >
                  {row.name}
                </Link>
              </Td>
              <Td className="text-zinc-700">{row.services_count}</Td>
              <Td className="text-zinc-700">{row.active_offers_count}</Td>
              <Td>
                <StatusBadge status={row.verification_status} />
              </Td>
              <Td className="text-zinc-500">{formatDate(row.updated_at)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  );
}
