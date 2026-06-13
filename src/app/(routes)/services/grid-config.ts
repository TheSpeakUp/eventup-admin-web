import type { ServiceStatus } from "@/lib/services/types";

// Plain (non-"use server") module: a `"use server"` file may export only async
// actions, so the grid page size + filter shape live here and are imported by
// both the page and the load-more action.
export const SERVICES_GRID_LIMIT = 12;

export type ServicesGridFilters = {
  search?: string;
  status?: ServiceStatus;
  providerId?: number;
};
