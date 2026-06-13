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
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";

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
      <Table data-testid="offers-table" className="table-auto">
        <Thead>
          <tr>
            <Th className="w-8">
              <input
                type="checkbox"
                aria-label="Select all offers"
                data-testid="offers-select-all"
                checked={allSelected}
                disabled={allIds.length === 0}
                onChange={toggleAll}
              />
            </Th>
            <Th>Offer</Th>
            <Th>Service</Th>
            <Th>Provider</Th>
            <Th>Created</Th>
            <Th>Waiting</Th>
            <Th>Queue</Th>
          </tr>
        </Thead>
        <Tbody>
          {items.map((it) => (
            <Tr key={it.offer_id} data-testid={`offers-row-${it.offer_id}`}>
              <Td>
                <input
                  type="checkbox"
                  aria-label={`Select offer ${it.offer_id}`}
                  data-testid={`offers-select-${it.offer_id}`}
                  checked={selected.has(it.offer_id)}
                  onChange={() => toggle(it.offer_id)}
                />
              </Td>
              <Td>
                <Link href={`/offers/${it.offer_id}`} className="text-zinc-900 underline">
                  #{it.offer_id}
                </Link>
              </Td>
              <Td>{it.service_title ?? `#${it.service_id}`}</Td>
              <Td>{it.provider_name ?? (it.provider_id ? `#${it.provider_id}` : "—")}</Td>
              <Td>{new Date(it.created_at).toISOString().slice(0, 16).replace("T", " ")}</Td>
              <Td>{it.waiting_hours.toFixed(1)}h</Td>
              <Td>
                <QueueStatusBadge status={it.queue_status} />
              </Td>
            </Tr>
          ))}
          {items.length === 0 ? (
            <Tr>
              <Td colSpan={7} data-testid="offers-empty" className="py-6 text-center text-zinc-500">
                No offers match the current filters.
              </Td>
            </Tr>
          ) : null}
        </Tbody>
      </Table>
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
