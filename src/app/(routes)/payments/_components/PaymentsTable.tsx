import Link from "next/link";
import { formatDateTime, formatMoneyMinor } from "@/lib/format";
import type { PaymentListItem } from "@/lib/payments/types";
import PaymentStatusBadge from "./PaymentStatusBadge";

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
      <table
        className="min-w-full divide-y divide-zinc-200 text-sm"
        data-testid="payments-table"
      >
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">ID</th>
            <th className="px-4 py-2.5 text-left font-medium">Resource</th>
            <th className="px-4 py-2.5 text-right font-medium">Amount</th>
            <th className="px-4 py-2.5 text-left font-medium">Status</th>
            <th className="px-4 py-2.5 text-left font-medium">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <tr
              key={row.id}
              data-testid={`payments-row-${row.id}`}
              className="hover:bg-zinc-50"
            >
              <td className="px-4 py-2.5">
                <Link
                  href={`/payments/${row.id}`}
                  className="font-mono text-xs text-zinc-900 hover:text-zinc-700 hover:underline"
                  data-testid={`payments-row-link-${row.id}`}
                >
                  #{row.id}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-zinc-700">{resourceRef(row)}</td>
              <td
                className="px-4 py-2.5 text-right font-medium text-zinc-900"
                data-testid={`payments-row-amount-${row.id}`}
              >
                {formatMoneyMinor(
                  row.total_gross_minor ?? row.amount_minor,
                  row.currency,
                )}
              </td>
              <td className="px-4 py-2.5">
                <PaymentStatusBadge status={row.status} />
              </td>
              <td className="px-4 py-2.5 text-zinc-500">
                {formatDateTime(row.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
