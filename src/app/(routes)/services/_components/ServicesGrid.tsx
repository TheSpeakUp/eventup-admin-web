"use client";

import type { ServiceListItem } from "@/lib/services/types";
import {
  LoadMoreButton,
  useLoadMore,
  type LoadMorePage,
} from "@/app/_components/ui";
import ServiceCard from "./ServiceCard";

// Grid view: a card per service plus an accumulating "Load more" button. Seeded
// with the server-rendered first page; `loadAction` is a bound server action
// that fetches the next page from a cursor (see load-more-action.ts).
export default function ServicesGrid({
  initial,
  loadAction,
}: {
  initial: LoadMorePage<ServiceListItem>;
  loadAction: (cursor: string) => Promise<LoadMorePage<ServiceListItem>>;
}) {
  const { items, hasMore, loading, error, loadMore } = useLoadMore(
    initial,
    loadAction,
  );

  if (items.length === 0) {
    return (
      <div
        data-testid="services-empty"
        className="m-4 rounded-md border border-dashed border-hairline-strong p-10 text-center text-sm text-ink-subtle"
      >
        No services match the current filters.
      </div>
    );
  }

  return (
    <div>
      <div
        data-testid="services-grid"
        className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((item) => (
          <ServiceCard key={item.id} item={item} />
        ))}
      </div>
      <LoadMoreButton
        hasMore={hasMore}
        loading={loading}
        error={error}
        shown={items.length}
        onLoadMore={loadMore}
        testid="services-load-more"
      />
    </div>
  );
}
