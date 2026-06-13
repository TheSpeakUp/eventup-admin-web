// src/app/(routes)/promotions/_components/OrdersTable.tsx
// Read-only orders list. Each row links to the order detail route
// (/promotions/orders/[id]) which exercises GET /promotions/orders/{id}.
import Link from "next/link";
import type { OrderListItem } from "@/lib/promotions/types";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";
import EmptyState from "@/app/_components/ui/EmptyState";
import StatusPill from "./StatusPill";

export default function OrdersTable({ rows }: { rows: OrderListItem[] }) {
  if (rows.length === 0)
    return <EmptyState data-testid="orders-empty">No promotion orders yet.</EmptyState>;
  return (
    <Table data-testid="orders-table">
      <Thead>
        <tr>
          <Th>Order</Th>
          <Th>Service</Th>
          <Th>Status</Th>
          <Th>Total</Th>
          <Th>Created</Th>
          <Th />
        </tr>
      </Thead>
      <Tbody>
        {rows.map((r) => (
          <Tr key={r.id} data-testid={`order-row-${r.id}`}>
            <Td className="font-mono text-xs">#{r.id}</Td>
            <Td>{r.service_id}</Td>
            <Td data-testid={`order-status-${r.id}`}>
              <StatusPill status={r.status} />
            </Td>
            <Td className="whitespace-nowrap">
              {r.total_price} {r.currency}
            </Td>
            <Td className="whitespace-nowrap text-zinc-500">
              {r.created_at.slice(0, 10)}
            </Td>
            <Td className="whitespace-nowrap">
              <Link
                href={`/promotions/orders/${r.id}`}
                data-testid={`order-view-${r.id}`}
                className="text-primary-hover"
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
