// src/app/(routes)/promotions/_components/OrdersTable.tsx
// Read-only orders list. Each row links to the order detail route
// (/promotions/orders/[id]) which exercises GET /promotions/orders/{id}.
import Link from "next/link";
import type { OrderListItem } from "@/lib/promotions/types";
import StatusPill from "./StatusPill";

export default function OrdersTable({ rows }: { rows: OrderListItem[] }) {
  if (rows.length === 0)
    return (
      <p data-testid="orders-empty" className="p-4 text-zinc-500">
        No promotion orders yet.
      </p>
    );
  return (
    <table className="w-full text-sm" data-testid="orders-table">
      <thead>
        <tr className="text-left text-zinc-500">
          <th className="py-2">Order</th>
          <th>Service</th>
          <th>Status</th>
          <th>Total</th>
          <th>Created</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.id}
            className="border-t border-zinc-200"
            data-testid={`order-row-${r.id}`}
          >
            <td className="py-2 font-mono text-xs">#{r.id}</td>
            <td>{r.service_id}</td>
            <td data-testid={`order-status-${r.id}`}>
              <StatusPill status={r.status} />
            </td>
            <td className="whitespace-nowrap">
              {r.total_price} {r.currency}
            </td>
            <td className="whitespace-nowrap text-zinc-500">
              {r.created_at.slice(0, 10)}
            </td>
            <td className="whitespace-nowrap">
              <Link
                href={`/promotions/orders/${r.id}`}
                data-testid={`order-view-${r.id}`}
                className="text-blue-700"
              >
                View
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
