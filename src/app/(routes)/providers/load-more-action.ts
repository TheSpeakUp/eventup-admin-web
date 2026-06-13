"use server";

import { listProviders } from "@/lib/providers/api";
import type { ProviderListItem } from "@/lib/providers/types";
import type { LoadMorePage } from "@/app/_components/ui";
import { PROVIDERS_GRID_LIMIT, type ProvidersGridFilters } from "./grid-config";

// Server action behind the grid "Load more" button. Re-queries the same
// filtered list from the given cursor and returns the next page in the shape
// `useLoadMore` accumulates. Throws on a failed load so the client surfaces a
// retry affordance. NOTE: a "use server" module may export ONLY async actions —
// the page size + filter type live in ./grid-config.
export async function loadMoreProviders(
  filters: ProvidersGridFilters,
  cursor: string,
): Promise<LoadMorePage<ProviderListItem>> {
  const lastId = Number(cursor);
  const res = await listProviders({
    search: filters.search,
    last_id: Number.isInteger(lastId) && lastId > 0 ? lastId : undefined,
    limit: PROVIDERS_GRID_LIMIT,
  });
  if (!res.ok) throw new Error(res.message);
  return {
    items: res.data.items,
    nextCursor:
      res.data.next_last_id != null ? String(res.data.next_last_id) : null,
    hasMore: res.data.has_more,
  };
}
