// src/lib/search/types.ts
import type { ProviderListItem } from "@/lib/providers/types";
import type { ServiceListItem } from "@/lib/services/types";

// A single fan-out group. `error` is set (and items empty) when that source's
// list call failed, so the UI can show a per-group failure without nuking the
// whole search page.
export type SearchGroup<T> = {
  items: T[];
  error: string | null;
};

export type GlobalSearchResults = {
  query: string;
  providers: SearchGroup<ProviderListItem>;
  services: SearchGroup<ServiceListItem>;
};

export type GlobalSearchTotals = {
  total: number;
  hasAnyError: boolean;
};

export function searchTotals(results: GlobalSearchResults): GlobalSearchTotals {
  return {
    total: results.providers.items.length + results.services.items.length,
    hasAnyError:
      results.providers.error !== null || results.services.error !== null,
  };
}
