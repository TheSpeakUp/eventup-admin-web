import Link from "next/link";
import { formatDateTime, formatMoneyMinor } from "@/lib/format";
import type { PaymentListItem } from "@/lib/payments/types";
import PaymentStatusBadge from "./PaymentStatusBadge";
import EmptyState from "@/app/_components/ui/EmptyState";
import { Table, THead, TBody, Tr, Th, Td } from "@/app/_components/ui/Table";

function resourceRef(row: PaymentListItem): string {
  const label = row.service_title ?? row.provider_name;
  if (label) return label;
  return `${row.resource_type} #${row.resource_id}`;
}

export default function PaymentsTable({ rows }: { rows: PaymentListItem[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState testid="payments-empty">
        No payments match the current filters.
      </EmptyState>
    );
  }
  return (
    <div data-testid="payments-table">
      <Table>
        <THead>
          <Tr>
            <Th>ID</Th>
            <Th>Resource</Th>
            <Th align="right">Amount</Th>
            <Th>Status</Th>
            <Th>Created</Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map((row) => (
            <Tr key={row.id} data-testid={`payments-row-${row.id}`}>
              <Td>
                <Link
                  href={`/payments/${row.id}`}
                  className="font-mono text-xs text-ink hover:text-ink-muted hover:underline"
                  data-testid={`payments-row-link-${row.id}`}
                >
                  #{row.id}
                </Link>
              </Td>
              <Td className="text-ink-muted">{resourceRef(row)}</Td>
              <Td
                align="right"
                className="font-medium"
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
              <Td className="text-ink-subtle">
                {formatDateTime(row.created_at)}
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
