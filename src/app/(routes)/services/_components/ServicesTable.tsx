"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ServiceListItem } from "@/lib/services/types";
import BulkModerationBar, {
  type BulkResult,
} from "@/app/_components/BulkModerationBar";
import { bulkModerateServices } from "../bulk-actions";
import StatusBadge from "./StatusBadge";

function formatPrice(minor: number | null, currency: string | null): string {
  if (minor === null) return "—";
  const fmt = new Intl.NumberFormat("en-US", {
    style: currency ? "currency" : "decimal",
    currency: currency ?? "USD",
    maximumFractionDigits: 0,
  });
  return fmt.format(minor / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

// Rows are selectable only while approve/reject is legal (on_review) — the
// client gate mirrors lib/moderation/transitions.ts so a bulk run cannot
// produce predictable per-row status failures.
const SELECTABLE_STATUS = "on_review";

export default function ServicesTable({ rows }: { rows: ServiceListItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<BulkResult>(null);
  const [pending, startTransition] = useTransition();

  const selectableIds = rows
    .filter((r) => r.status === SELECTABLE_STATUS)
    .map((r) => r.id);
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setResult(null);
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
    setResult(null);
  }

  function run(kind: "approve" | "reject", reason?: string) {
    const ids = [...selected];
    startTransition(async () => {
      const res = await bulkModerateServices({ kind, ids, reason });
      setResult(res);
      setSelected(new Set());
      router.refresh();
    });
  }

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
    <div>
      <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200 text-sm" data-testid="services-table">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  aria-label="Select all reviewable"
                  data-testid="services-select-all"
                  checked={allSelected}
                  disabled={selectableIds.length === 0}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-4 py-2.5 text-left font-medium">Title</th>
              <th className="px-4 py-2.5 text-left font-medium">Provider</th>
              <th className="px-4 py-2.5 text-left font-medium">Base price</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-left font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row.id} data-testid={`services-row-${row.id}`} className="hover:bg-zinc-50">
                <td className="px-4 py-2.5">
                  {row.status === SELECTABLE_STATUS ? (
                    <input
                      type="checkbox"
                      aria-label={`Select service ${row.id}`}
                      data-testid={`services-select-${row.id}`}
                      checked={selected.has(row.id)}
                      onChange={() => toggle(row.id)}
                    />
                  ) : null}
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/services/${row.id}`}
                    className="text-zinc-900 hover:text-zinc-700 hover:underline"
                    data-testid={`services-row-link-${row.id}`}
                  >
                    {row.title}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-zinc-700">
                  {row.provider_name ?? `#${row.provider_id}`}
                </td>
                <td className="px-4 py-2.5 text-zinc-700">
                  {formatPrice(row.base_price_minor, row.currency)}
                </td>
                <td className="px-4 py-2.5"><StatusBadge status={row.status} /></td>
                <td className="px-4 py-2.5 text-zinc-500">{formatDate(row.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <BulkModerationBar
        count={selected.size}
        pending={pending}
        result={result}
        onApprove={() => run("approve")}
        onReject={(reason) => run("reject", reason)}
        onClear={() => {
          setSelected(new Set());
          setResult(null);
        }}
      />
    </div>
  );
}
