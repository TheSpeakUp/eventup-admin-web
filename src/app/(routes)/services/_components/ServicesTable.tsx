import Link from "next/link";
import type { ServiceSummary } from "@/lib/services/types";
import StatusBadge from "./StatusBadge";

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export default function ServicesTable({ rows }: { rows: ServiceSummary[] }) {
  if (rows.length === 0) {
    return (
      <div
        data-testid="services-empty"
        className="rounded-md border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500"
      >
        No services match the current filters.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200 text-sm" data-testid="services-table">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Title</th>
            <th className="px-4 py-2.5 text-left font-medium">Provider</th>
            <th className="px-4 py-2.5 text-left font-medium">Category</th>
            <th className="px-4 py-2.5 text-left font-medium">Price</th>
            <th className="px-4 py-2.5 text-left font-medium">Status</th>
            <th className="px-4 py-2.5 text-left font-medium">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <tr key={row.id} data-testid={`services-row-${row.id}`} className="hover:bg-zinc-50">
              <td className="px-4 py-2.5">
                <Link
                  href={`/services/${row.id}`}
                  className="text-zinc-900 hover:text-zinc-700 hover:underline"
                  data-testid={`services-row-link-${row.id}`}
                >
                  {row.title}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-zinc-700">{row.provider_name}</td>
              <td className="px-4 py-2.5 text-zinc-700">{row.category}</td>
              <td className="px-4 py-2.5 text-zinc-700">{formatPrice(row.price_cents, row.currency)}</td>
              <td className="px-4 py-2.5"><StatusBadge status={row.status} /></td>
              <td className="px-4 py-2.5 text-zinc-500">{formatDate(row.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
