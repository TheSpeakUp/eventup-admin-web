import Link from "next/link";
import type { ServiceListItem } from "@/lib/services/types";
import { Icon } from "@/app/_components/ui";
import StatusBadge from "./StatusBadge";

function formatPrice(minor: number | null, currency: string | null): string {
  if (minor === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: currency ? "currency" : "decimal",
    currency: currency ?? "USD",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

// Grid-view card for a service. Mirrors the table columns (title, provider,
// price, status, updated) in a bounded, tappable card that links to the detail
// page. Presentational — no client state — so it is safe to render inside the
// client grid.
export default function ServiceCard({ item }: { item: ServiceListItem }) {
  return (
    <Link
      href={`/services/${item.id}`}
      data-testid={`services-card-${item.id}`}
      className="group flex flex-col rounded-lg border border-hairline bg-surface-2 p-4 transition-colors hover:border-hairline-strong hover:bg-surface-3"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-3 text-ink-subtle">
          <Icon name="services" size={16} />
        </span>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-3 truncate text-sm font-medium text-ink group-hover:text-ink">
        {item.title}
      </div>
      <div className="truncate text-xs text-ink-subtle">
        {item.provider_name ?? `Provider #${item.provider_id}`}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-base font-semibold tabular-nums tracking-tight text-ink">
          {formatPrice(item.base_price_minor, item.currency)}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-ink-tertiary">
          {formatDate(item.updated_at)}
        </span>
      </div>
    </Link>
  );
}
