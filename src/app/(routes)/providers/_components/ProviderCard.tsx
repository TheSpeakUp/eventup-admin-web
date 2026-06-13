import Link from "next/link";
import type { ProviderListItem } from "@/lib/providers/types";
import { Icon } from "@/app/_components/ui";
import StatusBadge from "./StatusBadge";

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

// Grid-view card for a provider. Mirrors the table columns (name, status,
// services/offers counts, updated) in a bounded, tappable card that links to
// the detail page. Presentational — no client state — so it is safe to render
// inside the client grid.
export default function ProviderCard({ item }: { item: ProviderListItem }) {
  return (
    <Link
      href={`/providers/${item.id}`}
      data-testid={`providers-card-${item.id}`}
      className="group flex flex-col rounded-lg border border-hairline bg-surface-2 p-4 transition-colors hover:border-hairline-strong hover:bg-surface-3"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-3 text-ink-subtle">
          <Icon name="providers" size={16} />
        </span>
        <StatusBadge status={item.verification_status} />
      </div>
      <div className="mt-3 truncate text-sm font-medium text-ink group-hover:text-ink">
        {item.name}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-xs text-ink-subtle">
          {item.services_count} services · {item.active_offers_count} offers
        </span>
        <span className="shrink-0 text-xs tabular-nums text-ink-tertiary">
          {formatDate(item.updated_at)}
        </span>
      </div>
    </Link>
  );
}
