"use server";

import { listServices } from "@/lib/services/api";
import type { ServiceListItem } from "@/lib/services/types";
import type { LoadMorePage } from "@/app/_components/ui";
import { SERVICES_GRID_LIMIT, type ServicesGridFilters } from "./grid-config";

// Server action behind the grid "Load more" button. Re-queries the same
// filtered list from the given cursor and returns the next page in the shape
// `useLoadMore` accumulates. Throws on a failed load so the client surfaces a
// retry affordance. NOTE: a "use server" module may export ONLY async actions —
// the page size + filter type live in ./grid-config.
export async function loadMoreServices(
  filters: ServicesGridFilters,
  cursor: string,
): Promise<LoadMorePage<ServiceListItem>> {
  const lastId = Number(cursor);
  const res = await listServices({
    search: filters.search,
    status: filters.status,
    provider_id: filters.providerId,
    last_id: Number.isInteger(lastId) && lastId > 0 ? lastId : undefined,
    limit: SERVICES_GRID_LIMIT,
  });
  if (!res.ok) throw new Error(res.message);
  return {
    items: res.data.items,
    nextCursor:
      res.data.next_last_id != null ? String(res.data.next_last_id) : null,
    hasMore: res.data.has_more,
  };
}
