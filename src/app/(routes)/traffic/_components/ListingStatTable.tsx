import Link from "next/link";
import {
  formatCount,
  formatCtr,
  type ListingStat,
  type ListingType,
} from "@/lib/traffic/types";

export default function ListingStatTable({
  rows,
  type,
  testid,
  emptyLabel,
}: {
  rows: ListingStat[];
  type: ListingType;
  testid: string;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <div
        data-testid={`${testid}-empty`}
        className="rounded border border-zinc-200 bg-white p-4 text-sm text-zinc-500"
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <table
      data-testid={testid}
      className="w-full border-collapse overflow-hidden rounded border border-zinc-200 bg-white text-sm"
    >
      <thead>
        <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500">
          <th className="px-3 py-2 font-medium">Listing</th>
          <th className="px-3 py-2 font-medium">Provider</th>
          <th className="px-3 py-2 text-right font-medium">Views</th>
          <th className="px-3 py-2 text-right font-medium">Clicks</th>
          <th className="px-3 py-2 text-right font-medium">CTR</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.subject_id}
            data-testid={`${testid}-row-${r.subject_id}`}
            className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
          >
            <td className="px-3 py-2">
              <Link
                href={`/traffic/listings/${type}/${r.subject_id}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {r.name ?? `#${r.subject_id}`}
              </Link>
            </td>
            <td className="px-3 py-2 text-zinc-600">
              {r.provider_name ?? "—"}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              {formatCount(r.views)}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              {formatCount(r.clicks)}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              {formatCtr(r.ctr)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
