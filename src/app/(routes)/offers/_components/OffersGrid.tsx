import type { SlaSummaryItem } from "@/lib/offers/types";
import OfferCard from "./OfferCard";

// Grid view for the SLA queue. The queue endpoint returns the whole window in
// one shot (no cursor), so this is a plain card grid with no "Load more".
export default function OffersGrid({ items }: { items: SlaSummaryItem[] }) {
  if (items.length === 0) {
    return (
      <div
        data-testid="offers-empty"
        className="m-4 rounded-md border border-dashed border-hairline-strong p-10 text-center text-sm text-ink-subtle"
      >
        No offers in the selected queue.
      </div>
    );
  }
  return (
    <div
      data-testid="offers-grid"
      className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {items.map((item) => (
        <OfferCard key={item.offer_id} item={item} />
      ))}
    </div>
  );
}
