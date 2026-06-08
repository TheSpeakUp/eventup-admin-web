import Link from "next/link";
import type { SlaSummaryItem } from "@/lib/offers/types";
import QueueStatusBadge from "./QueueStatusBadge";

export default function OffersTable({ items }: { items: SlaSummaryItem[] }) {
  return (
    <table data-testid="offers-table" className="w-full table-auto text-sm">
      <thead className="text-left text-xs uppercase text-zinc-500">
        <tr>
          <th className="px-2 py-1">Offer</th>
          <th className="px-2 py-1">Service</th>
          <th className="px-2 py-1">Provider</th>
          <th className="px-2 py-1">Created</th>
          <th className="px-2 py-1">Waiting</th>
          <th className="px-2 py-1">Queue</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it) => (
          <tr key={it.offer_id} data-testid={`offers-row-${it.offer_id}`} className="border-t border-zinc-100 hover:bg-zinc-50">
            <td className="px-2 py-1">
              <Link href={`/offers/${it.offer_id}`} className="text-zinc-900 underline">
                #{it.offer_id}
              </Link>
            </td>
            <td className="px-2 py-1">{it.service_title ?? `#${it.service_id}`}</td>
            <td className="px-2 py-1">{it.provider_name ?? (it.provider_id ? `#${it.provider_id}` : "—")}</td>
            <td className="px-2 py-1">{new Date(it.created_at).toISOString().slice(0, 16).replace("T", " ")}</td>
            <td className="px-2 py-1">{it.waiting_hours.toFixed(1)}h</td>
            <td className="px-2 py-1">
              <QueueStatusBadge status={it.queue_status} />
            </td>
          </tr>
        ))}
        {items.length === 0 ? (
          <tr>
            <td colSpan={6} data-testid="offers-empty" className="px-2 py-6 text-center text-zinc-500">
              No offers match the current filters.
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}
