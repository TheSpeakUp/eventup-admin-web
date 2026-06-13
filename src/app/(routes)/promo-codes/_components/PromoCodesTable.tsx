// src/app/(routes)/promo-codes/_components/PromoCodesTable.tsx
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import {
  targetingSummary,
  type PromoCodeRead,
} from "@/lib/promo-codes/types";
import EmptyState from "@/app/_components/ui/EmptyState";
import { Table, THead, TBody, Tr, Th, Td } from "@/app/_components/ui/Table";
import PromoStatusBadge from "./PromoStatusBadge";

function discountLabel(r: PromoCodeRead): string {
  if (r.discount_type === "percent") return `${r.discount_value}%`;
  if (r.discount_type === "fixed_amount")
    return `${r.discount_value} ${r.currency ?? ""}`.trim();
  return `${r.discount_value} (${r.discount_type})`;
}

function validityLabel(r: PromoCodeRead): string {
  const from = r.valid_from ? formatDateTime(r.valid_from) : "—";
  const until = r.valid_until ? formatDateTime(r.valid_until) : "—";
  return `${from} → ${until}`;
}

function usageLabel(r: PromoCodeRead): string {
  return r.max_uses != null
    ? `${r.used_count} / ${r.max_uses}`
    : `${r.used_count} / ∞`;
}

export default function PromoCodesTable({ rows }: { rows: PromoCodeRead[] }) {
  if (rows.length === 0)
    return (
      <EmptyState testid="promo-codes-empty">
        No promo codes match these filters.
      </EmptyState>
    );
  return (
    <div data-testid="promo-codes-table">
    <Table>
      <THead>
        <Tr>
          <Th>Code</Th>
          <Th>Discount</Th>
          <Th>Validity</Th>
          <Th>Usage</Th>
          <Th>Targeting</Th>
          <Th>Status</Th>
          <Th />
        </Tr>
      </THead>
      <TBody>
        {rows.map((r) => (
          <Tr key={r.id} data-testid={`promo-row-${r.id}`}>
            <Td className="font-medium">{r.code}</Td>
            <Td>{discountLabel(r)}</Td>
            <Td className="text-ink-subtle">{validityLabel(r)}</Td>
            <Td>{usageLabel(r)}</Td>
            <Td data-testid={`promo-targeting-${r.id}`} className="text-ink-subtle">
              {targetingSummary(r.targeting_rules)}
            </Td>
            <Td>
              <PromoStatusBadge isActive={r.is_active} />
            </Td>
            <Td>
              <Link
                href={`/promo-codes/${r.id}`}
                data-testid={`promo-view-${r.id}`}
                className="text-primary-hover hover:underline"
              >
                View
              </Link>
            </Td>
          </Tr>
        ))}
      </TBody>
    </Table>
    </div>
  );
}
