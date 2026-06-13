"use client";

import type { ProviderListItem } from "@/lib/providers/types";
import {
  LoadMoreButton,
  useLoadMore,
  type LoadMorePage,
} from "@/app/_components/ui";
import ProviderCard from "./ProviderCard";

// Grid view: a card per provider plus an accumulating "Load more" button.
// Seeded with the server-rendered first page; `loadAction` is a bound server
// action that fetches the next page from a cursor (see load-more-action.ts).
export default function ProvidersGrid({
  initial,
  loadAction,
}: {
  initial: LoadMorePage<ProviderListItem>;
  loadAction: (cursor: string) => Promise<LoadMorePage<ProviderListItem>>;
}) {
  const { items, hasMore, loading, error, loadMore } = useLoadMore(
    initial,
    loadAction,
  );

  if (items.length === 0) {
    return (
      <div
        data-testid="providers-empty"
        className="m-4 rounded-md border border-dashed border-hairline-strong p-10 text-center text-sm text-ink-subtle"
      >
        No providers match the current filters.
      </div>
    );
  }

  return (
    <div>
      <div
        data-testid="providers-grid"
        className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((item) => (
          <ProviderCard key={item.id} item={item} />
        ))}
      </div>
      <LoadMoreButton
        hasMore={hasMore}
        loading={loading}
        error={error}
        shown={items.length}
        onLoadMore={loadMore}
        testid="providers-load-more"
      />
    </div>
  );
}
