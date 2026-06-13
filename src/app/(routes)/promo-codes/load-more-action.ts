"use server";

import { listPromoCodes } from "@/lib/promo-codes/api";
import type {
  PromoCodeFilter,
  PromoCodeRead,
} from "@/lib/promo-codes/types";
import type { LoadMorePage } from "@/app/_components/ui";
import { PROMO_GRID_LIMIT, type PromoGridFilters } from "./grid-config";

// Server action behind the grid "Load more" button. Promo codes are OFFSET
// paginated, so the opaque cursor IS the next offset (as a string). Re-queries
// the same filtered list from that offset and returns the next page in the
// shape `useLoadMore` accumulates. Throws on a failed load so the client
// surfaces a retry affordance. NOTE: a "use server" module may export ONLY
// async actions — the page size + filter type live in ./grid-config.
export async function loadMorePromoCodes(
  filters: PromoGridFilters,
  cursor: string,
): Promise<LoadMorePage<PromoCodeRead>> {
  const offset = Number(cursor) || 0;

  const filter: PromoCodeFilter = {
    limit: PROMO_GRID_LIMIT,
    offset,
  };
  if (filters.code) filter.code = filters.code;
  if (filters.status === "active") filter.is_active = true;
  if (filters.status === "inactive") filter.is_active = false;

  const res = await listPromoCodes(filter);
  if (!res.ok) throw new Error(res.message);

  const hasMore = res.data.has_more;
  return {
    items: res.data.items,
    nextCursor: hasMore ? String(offset + PROMO_GRID_LIMIT) : null,
    hasMore,
  };
}
