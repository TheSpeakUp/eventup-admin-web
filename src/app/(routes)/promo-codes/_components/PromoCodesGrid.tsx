"use client";

import type { PromoCodeRead } from "@/lib/promo-codes/types";
import {
  LoadMoreButton,
  useLoadMore,
  type LoadMorePage,
} from "@/app/_components/ui";
import PromoCodeCard from "./PromoCodeCard";

// Grid view: a card per promo code plus an accumulating "Load more" button.
// Seeded with the server-rendered first page; `loadAction` is a bound server
// action that fetches the next page from an offset cursor (see
// load-more-action.ts). `total` comes from the list response so the footer can
// show "N of TOTAL shown".
export default function PromoCodesGrid({
  initial,
  loadAction,
  total,
}: {
  initial: LoadMorePage<PromoCodeRead>;
  loadAction: (cursor: string) => Promise<LoadMorePage<PromoCodeRead>>;
  total: number;
}) {
  const { items, hasMore, loading, error, loadMore } = useLoadMore(
    initial,
    loadAction,
  );

  if (items.length === 0) {
    return (
      <div
        data-testid="promo-empty"
        className="m-4 rounded-md border border-dashed border-hairline-strong p-10 text-center text-sm text-ink-subtle"
      >
        No promo codes match these filters.
      </div>
    );
  }

  return (
    <div>
      <div
        data-testid="promo-grid"
        className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((item) => (
          <PromoCodeCard key={item.id} item={item} />
        ))}
      </div>
      <LoadMoreButton
        hasMore={hasMore}
        loading={loading}
        error={error}
        shown={items.length}
        total={total}
        onLoadMore={loadMore}
        testid="promo-load-more"
      />
    </div>
  );
}
