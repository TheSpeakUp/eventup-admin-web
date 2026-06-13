import Link from "next/link";
import type { ProviderListItem } from "@/lib/providers/types";
import StatusBadge from "./StatusBadge";
import EmptyState from "@/app/_components/ui/EmptyState";
import { Table, THead, TBody, Tr, Th, Td } from "@/app/_components/ui/Table";

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export default function ProvidersTable({ rows }: { rows: ProviderListItem[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState testid="providers-empty">
        No providers match the current search.
      </EmptyState>
    );
  }
  return (
    <div data-testid="providers-table">
      <Table>
        <THead>
          <Tr>
            <Th>Name</Th>
            <Th>Services</Th>
            <Th>Active offers</Th>
            <Th>Status</Th>
            <Th>Updated</Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map((row) => (
            <Tr key={row.id} data-testid={`providers-row-${row.id}`}>
              <Td>
                <Link
                  href={`/providers/${row.id}`}
                  className="text-ink hover:text-ink-muted hover:underline"
                  data-testid={`providers-row-link-${row.id}`}
                >
                  {row.name}
                </Link>
              </Td>
              <Td className="text-ink-muted">{row.services_count}</Td>
              <Td className="text-ink-muted">{row.active_offers_count}</Td>
              <Td>
                <StatusBadge status={row.verification_status} />
              </Td>
              <Td className="text-ink-subtle">{formatDate(row.updated_at)}</Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
