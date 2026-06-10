// src/lib/search/types.ts

// Hit shapes mirror the backend AdminGlobalSearchResponse
// (GET /eventup-admin/v1/marketplace/search) — lean rows purpose-built for the
// header quick-jump, not the full list-item types of each surface.
export type SearchProviderHit = {
  id: number;
  name: string;
  verification_status: string;
};

export type SearchServiceHit = {
  id: number;
  title: string;
  status: string;
  provider_id: number;
  provider_name: string | null;
};

export type SearchOfferHit = {
  id: number;
  title: string;
  status: string;
  service_id: number;
  service_title: string | null;
  provider_id: number | null;
  provider_name: string | null;
};

// One result group. `total` is the full backend match count (items are capped
// per group); `error` is set (and items empty) when the search call failed, so
// the UI keeps its per-group failure rendering.
export type SearchGroup<T> = {
  items: T[];
  total: number;
  error: string | null;
};

export type GlobalSearchResults = {
  query: string;
  providers: SearchGroup<SearchProviderHit>;
  services: SearchGroup<SearchServiceHit>;
  offers: SearchGroup<SearchOfferHit>;
};

// Wire shape of the backend response (groups carry no `error` field).
export type GlobalSearchApiResponse = {
  query: string;
  providers: { items: SearchProviderHit[]; total: number };
  services: { items: SearchServiceHit[]; total: number };
  offers: { items: SearchOfferHit[]; total: number };
};

export type GlobalSearchTotals = {
  total: number;
  hasAnyError: boolean;
};

export function searchTotals(results: GlobalSearchResults): GlobalSearchTotals {
  return {
    total:
      results.providers.items.length +
      results.services.items.length +
      results.offers.items.length,
    hasAnyError:
      results.providers.error !== null ||
      results.services.error !== null ||
      results.offers.error !== null,
  };
}
