"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SlaSummaryItem } from "@/lib/offers/types";
import BulkModerationBar, {
  type BulkResult,
} from "@/app/_components/BulkModerationBar";
import { bulkModerateOffers } from "../bulk-actions";
import QueueStatusBadge from "./QueueStatusBadge";

// The SLA queue lists on_review offers only, so every row is bulk-selectable
// (approve/reject are legal exactly from on_review).
export default function OffersTable({ items }: { items: SlaSummaryItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<BulkResult>(null);
  const [pending, startTransition] = useTransition();

  const allIds = items.map((it) => it.offer_id);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.has(id));

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
    setSelected(allSelected ? new Set() : new Set(allIds));
    setResult(null);
  }

  function run(kind: "approve" | "reject", reason?: string) {
    const ids = [...selected];
    startTransition(async () => {
      const res = await bulkModerateOffers({ kind, ids, reason });
      setResult(res);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div>
      <table data-testid="offers-table" className="w-full table-auto text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500">
          <tr>
            <th className="w-8 px-2 py-1">
              <input
                type="checkbox"
                aria-label="Select all offers"
                data-testid="offers-select-all"
                checked={allSelected}
                disabled={allIds.length === 0}
                onChange={toggleAll}
              />
            </th>
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
                <input
                  type="checkbox"
                  aria-label={`Select offer ${it.offer_id}`}
                  data-testid={`offers-select-${it.offer_id}`}
                  checked={selected.has(it.offer_id)}
                  onChange={() => toggle(it.offer_id)}
                />
              </td>
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
              <td colSpan={7} data-testid="offers-empty" className="px-2 py-6 text-center text-zinc-500">
                No offers match the current filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
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
