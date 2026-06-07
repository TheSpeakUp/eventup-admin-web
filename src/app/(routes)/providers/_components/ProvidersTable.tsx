import Link from "next/link";
import type { ProviderSummary } from "@/lib/providers/types";
import StatusBadge from "./StatusBadge";

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export default function ProvidersTable({ rows }: { rows: ProviderSummary[] }) {
  if (rows.length === 0) {
    return (
      <div
        data-testid="providers-empty"
        className="rounded-md border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500"
      >
        No providers match the current filters.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200 text-sm" data-testid="providers-table">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Name</th>
            <th className="px-4 py-2.5 text-left font-medium">Contact</th>
            <th className="px-4 py-2.5 text-left font-medium">Category</th>
            <th className="px-4 py-2.5 text-left font-medium">Status</th>
            <th className="px-4 py-2.5 text-left font-medium">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <tr key={row.id} data-testid={`providers-row-${row.id}`} className="hover:bg-zinc-50">
              <td className="px-4 py-2.5">
                <Link
                  href={`/providers/${row.id}`}
                  className="text-zinc-900 hover:text-zinc-700 hover:underline"
                  data-testid={`providers-row-link-${row.id}`}
                >
                  {row.name}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-zinc-700">{row.contact_email}</td>
              <td className="px-4 py-2.5 text-zinc-700">{row.category}</td>
              <td className="px-4 py-2.5"><StatusBadge status={row.status} /></td>
              <td className="px-4 py-2.5 text-zinc-500">{formatDate(row.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
