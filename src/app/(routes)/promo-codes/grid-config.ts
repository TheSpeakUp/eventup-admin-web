// Plain (non-"use server") module: a `"use server"` file may export only async
// actions, so the grid page size + filter shape live here and are imported by
// both the page and the load-more action.
export const PROMO_GRID_LIMIT = 12;

export type PromoGridFilters = {
  status?: "active" | "inactive";
  code?: string;
};
