import Link from "next/link";
import { formatDateTime, formatMoneyMinor } from "@/lib/format";
import type { PaymentListItem } from "@/lib/payments/types";
import PaymentStatusBadge from "./PaymentStatusBadge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";

function resourceRef(row: PaymentListItem): string {
  const label = row.service_title ?? row.provider_name;
  if (label) return label;
  return `${row.resource_type} #${row.resource_id}`;
}

export default function PaymentsTable({ rows }: { rows: PaymentListItem[] }) {
  if (rows.length === 0) {
    return (
      <div
        data-testid="payments-empty"
        className="rounded-md border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500"
      >
        No payments match the current filters.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 bg-surface-1">
      <Table className="min-w-full" data-testid="payments-table">
        <Thead>
          <tr>
            <Th>ID</Th>
            <Th>Resource</Th>
            <Th className="text-right">Amount</Th>
            <Th>Status</Th>
            <Th>Created</Th>
          </tr>
        </Thead>
        <Tbody>
          {rows.map((row) => (
            <Tr key={row.id} data-testid={`payments-row-${row.id}`}>
              <Td>
                <Link
                  href={`/payments/${row.id}`}
                  className="font-mono text-xs text-zinc-900 hover:text-zinc-700 hover:underline"
                  data-testid={`payments-row-link-${row.id}`}
                >
                  #{row.id}
                </Link>
              </Td>
              <Td className="text-zinc-700">{resourceRef(row)}</Td>
              <Td
                className="text-right font-medium text-zinc-900"
                data-testid={`payments-row-amount-${row.id}`}
              >
                {formatMoneyMinor(
                  row.total_gross_minor ?? row.amount_minor,
                  row.currency,
                )}
              </Td>
              <Td>
                <PaymentStatusBadge status={row.status} />
              </Td>
              <Td className="text-zinc-500">
                {formatDateTime(row.created_at)}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  );
}
