import Link from "next/link";
import type { SlaSummaryItem } from "@/lib/offers/types";
import { Icon } from "@/app/_components/ui";
import QueueStatusBadge from "./QueueStatusBadge";

// Grid-view card for an SLA-queue offer. The waiting time is the headline metric
// (it drives triage), with the queue-status badge, service and provider for
// context. Links to the offer detail. Presentational — safe in a server render.
export default function OfferCard({ item }: { item: SlaSummaryItem }) {
  return (
    <Link
      href={`/offers/${item.offer_id}`}
      data-testid={`offers-card-${item.offer_id}`}
      className="group flex flex-col rounded-lg border border-hairline bg-surface-2 p-4 transition-colors hover:border-hairline-strong hover:bg-surface-3"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-3 text-ink-subtle">
          <Icon name="offers" size={16} />
        </span>
        <QueueStatusBadge status={item.queue_status} />
      </div>
      <div className="mt-3 truncate text-sm font-medium text-ink">
        {item.service_title ?? `Service #${item.service_id}`}
      </div>
      <div className="truncate text-xs text-ink-subtle">
        {item.provider_name ?? `Provider #${item.provider_id ?? "—"}`}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-base font-semibold tabular-nums tracking-tight text-ink">
          {item.waiting_hours}h
        </span>
        <span className="shrink-0 text-xs text-ink-tertiary">waiting</span>
      </div>
    </Link>
  );
}
