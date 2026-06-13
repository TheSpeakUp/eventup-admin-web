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
import { Table, THead, TBody, Tr, Th, Td } from "@/app/_components/ui/Table";
import EmptyState from "@/app/_components/ui/EmptyState";

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
      <EmptyState testid="services-empty">
        No services match the current filters.
      </EmptyState>
    );
  }
  return (
    <div>
      <div data-testid="services-table">
      <Table>
        <THead>
          <Tr>
            <Th className="w-10">
              <input
                type="checkbox"
                aria-label="Select all reviewable"
                data-testid="services-select-all"
                checked={allSelected}
                disabled={selectableIds.length === 0}
                onChange={toggleAll}
              />
            </Th>
            <Th>Title</Th>
            <Th>Provider</Th>
            <Th>Base price</Th>
            <Th>Status</Th>
            <Th>Updated</Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map((row) => (
            <Tr key={row.id} data-testid={`services-row-${row.id}`}>
              <Td>
                {row.status === SELECTABLE_STATUS ? (
                  <input
                    type="checkbox"
                    aria-label={`Select service ${row.id}`}
                    data-testid={`services-select-${row.id}`}
                    checked={selected.has(row.id)}
                    onChange={() => toggle(row.id)}
                  />
                ) : null}
              </Td>
              <Td>
                <Link
                  href={`/services/${row.id}`}
                  className="text-ink hover:text-ink-muted hover:underline"
                  data-testid={`services-row-link-${row.id}`}
                >
                  {row.title}
                </Link>
              </Td>
              <Td className="text-ink-muted">
                {row.provider_name ?? `#${row.provider_id}`}
              </Td>
              <Td className="text-ink-muted">
                {formatPrice(row.base_price_minor, row.currency)}
              </Td>
              <Td><StatusBadge status={row.status} /></Td>
              <Td className="text-ink-subtle">{formatDate(row.updated_at)}</Td>
            </Tr>
          ))}
        </TBody>
      </Table>
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
