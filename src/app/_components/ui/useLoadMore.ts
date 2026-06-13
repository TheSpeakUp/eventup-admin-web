"use client";

import { useCallback, useState } from "react";

export type LoadMorePage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

/**
 * Accumulating "load more" state for the grid view. Seeded with the
 * server-rendered first page, then each `loadMore()` calls a bound server
 * action with the current cursor and appends the next page. Cursor-agnostic:
 * `nextCursor` is whatever opaque string the action round-trips (a `last_id`
 * for cursor lists, an `offset` for offset lists).
 */
export function useLoadMore<T>(
  initial: LoadMorePage<T>,
  load: (cursor: string) => Promise<LoadMorePage<T>>,
) {
  const [items, setItems] = useState<T[]>(initial.items);
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor);
  const [hasMore, setHasMore] = useState<boolean>(initial.hasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const page = await load(cursor);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch {
      setError("Couldn’t load more — try again.");
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, load]);

  return { items, hasMore, loading, error, loadMore };
}
