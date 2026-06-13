// Plain (non-"use server") module: a `"use server"` file may export only async
// actions, so the grid page size + filter shape live here and are imported by
// both the page and the load-more action. Providers has no status filter, so
// the only grid filter is `search`.
export const PROVIDERS_GRID_LIMIT = 12;

export type ProvidersGridFilters = {
  search?: string;
};
