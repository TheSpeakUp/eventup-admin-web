// src/app/(routes)/promo-codes/_components/PromoCodesTable.tsx
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import {
  targetingSummary,
  type PromoCodeRead,
} from "@/lib/promo-codes/types";
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
      <p data-testid="promo-codes-empty" className="p-4 text-zinc-500">
        No promo codes match these filters.
      </p>
    );
  return (
    <table className="w-full text-sm" data-testid="promo-codes-table">
      <thead>
        <tr className="text-left text-zinc-500">
          <th className="py-2">Code</th>
          <th>Discount</th>
          <th>Validity</th>
          <th>Usage</th>
          <th>Targeting</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.id}
            className="border-t border-zinc-200"
            data-testid={`promo-row-${r.id}`}
          >
            <td className="py-2 font-medium">{r.code}</td>
            <td>{discountLabel(r)}</td>
            <td className="text-zinc-600">{validityLabel(r)}</td>
            <td>{usageLabel(r)}</td>
            <td data-testid={`promo-targeting-${r.id}`} className="text-zinc-600">
              {targetingSummary(r.targeting_rules)}
            </td>
            <td>
              <PromoStatusBadge isActive={r.is_active} />
            </td>
            <td>
              <Link
                href={`/promo-codes/${r.id}`}
                data-testid={`promo-view-${r.id}`}
                className="text-blue-700"
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
