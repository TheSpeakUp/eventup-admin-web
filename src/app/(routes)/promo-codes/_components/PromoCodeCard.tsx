import Link from "next/link";
import type { PromoCodeRead } from "@/lib/promo-codes/types";
import { Badge, Icon } from "@/app/_components/ui";

// Mirror the table's discount column: "20%" for percent, "10 USD" for fixed.
function discountLabel(r: PromoCodeRead): string {
  if (r.discount_type === "percent") return `${r.discount_value}%`;
  if (r.discount_type === "fixed_amount")
    return `${r.discount_value} ${r.currency ?? ""}`.trim();
  return `${r.discount_value} (${r.discount_type})`;
}

// Mirror the table's usage column: "used / max" or "used / ∞".
function usageLabel(r: PromoCodeRead): string {
  return r.max_uses != null
    ? `${r.used_count} / ${r.max_uses}`
    : `${r.used_count} / ∞`;
}

// Grid-view card for a promo code. Mirrors the table columns (code, discount,
// usage, status) in a bounded, tappable card linking to the detail page.
// Presentational — no client state — so it is safe to render inside the client
// grid.
export default function PromoCodeCard({ item }: { item: PromoCodeRead }) {
  return (
    <Link
      href={`/promo-codes/${item.id}`}
      data-testid={`promo-card-${item.id}`}
      className="group flex flex-col rounded-lg border border-hairline bg-surface-2 p-4 transition-colors hover:border-hairline-strong hover:bg-surface-3"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-3 text-ink-subtle">
          <Icon name="promo-codes" size={16} />
        </span>
        <Badge tone={item.is_active ? "success" : "neutral"}>
          {item.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>
      <div className="mt-3 truncate text-sm font-medium text-ink group-hover:text-ink">
        {item.code}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-base font-semibold tabular-nums tracking-tight text-ink">
          {discountLabel(item)}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-ink-tertiary">
          {usageLabel(item)}
        </span>
      </div>
    </Link>
  );
}
