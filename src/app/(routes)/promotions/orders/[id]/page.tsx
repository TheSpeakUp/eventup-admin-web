// src/app/(routes)/promotions/orders/[id]/page.tsx
//
// Order detail — exercises GET /promotions/orders/{id}. Read-only: summary +
// line items. A 404 renders an actionable not-found panel (same idiom as the
// product detail route).
import Link from "next/link";
import { getOrder } from "@/lib/promotions/api";
import StatusPill from "../../_components/StatusPill";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getOrder(Number(id));

  if (!res.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Promotion order</h1>
        <div
          data-testid="order-detail-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {res.status === 404
            ? `No promotion order with id ${id}.`
            : res.status === 403
              ? "Viewing promotions requires an admin role."
              : `Failed to load order: ${res.message}`}
        </div>
        <Link
          href="/promotions?tab=orders"
          className="mt-4 inline-block text-sm text-blue-700"
        >
          ← Back to orders
        </Link>
      </div>
    );
  }

  const o = res.data;
  return (
    <div className="p-8">
      <div className="flex items-center gap-3">
        <h1
          className="text-2xl font-semibold"
          data-testid="order-detail-id"
        >
          Order #{o.id}
        </h1>
        <StatusPill status={o.status} />
      </div>
      <dl className="mt-4 max-w-xl space-y-2 text-sm text-zinc-700">
        <div className="flex gap-2">
          <dt className="w-40 text-zinc-500">Service id</dt>
          <dd>{o.service_id}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 text-zinc-500">Total</dt>
          <dd>
            {o.total_price} {o.currency}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 text-zinc-500">Created</dt>
          <dd>{o.created_at}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 text-zinc-500">Paid</dt>
          <dd>{o.paid_at ?? "—"}</dd>
        </div>
      </dl>

      <h2 className="mt-6 text-lg font-semibold">Line items</h2>
      <table className="mt-2 w-full text-sm" data-testid="order-items-table">
        <thead>
          <tr className="text-left text-zinc-500">
            <th className="py-2">Item</th>
            <th>Type</th>
            <th>Units</th>
            <th>Unit price</th>
            <th>Discount</th>
            <th>Final</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((it) => (
            <tr
              key={it.id}
              className="border-t border-zinc-200"
              data-testid={`order-item-row-${it.id}`}
            >
              <td className="py-2 font-mono text-xs">#{it.id}</td>
              <td>{it.item_type}</td>
              <td>{it.units}</td>
              <td>{it.unit_price}</td>
              <td>
                {it.discount_percent}% ({it.discount_amount})
              </td>
              <td>{it.final_price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Link
        href="/promotions?tab=orders"
        className="mt-6 inline-block text-sm text-blue-700"
      >
        ← Back to orders
      </Link>
    </div>
  );
}
