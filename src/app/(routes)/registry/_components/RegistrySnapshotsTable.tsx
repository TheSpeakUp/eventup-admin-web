import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import type { RegistrySnapshot } from "@/lib/registry/types";

export function RegistrySnapshotsTable({
  rows,
}: {
  rows: RegistrySnapshot[];
}) {
  if (rows.length === 0) {
    return (
      <p
        data-testid="registry-empty"
        className="rounded border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500"
      >
        No registry snapshots match the current filters.
      </p>
    );
  }
  return (
    <table
      data-testid="registry-table"
      className="w-full border-collapse text-sm"
    >
      <thead>
        <tr className="border-b border-zinc-200 text-left text-zinc-500">
          <th className="py-2 pr-4">ID</th>
          <th className="py-2 pr-4">Entity</th>
          <th className="py-2 pr-4">Action</th>
          <th className="py-2 pr-4">Attribute key</th>
          <th className="py-2 pr-4">Actor</th>
          <th className="py-2 pr-4">When</th>
          <th className="py-2 pr-4"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.id}
            data-testid="registry-row"
            data-snapshot-id={r.id}
            className="border-b border-zinc-100"
          >
            <td className="py-2 pr-4 font-mono text-xs">{r.id}</td>
            <td className="py-2 pr-4">{r.entity_type}</td>
            <td className="py-2 pr-4">{r.action}</td>
            <td className="py-2 pr-4 font-mono text-xs">{r.attribute_key}</td>
            <td className="py-2 pr-4 text-zinc-600">
              {r.actor_display_name ?? "—"}
            </td>
            <td className="py-2 pr-4 text-zinc-500">
              {formatDateTime(r.created_at)}
            </td>
            <td className="py-2 pr-4">
              <Link
                href={`/registry/snapshots/${r.id}`}
                data-testid="registry-row-view"
                className="text-primary-hover hover:underline"
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
