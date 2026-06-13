// src/app/(routes)/search/page.tsx
import Link from "next/link";
import { globalSearch } from "@/lib/search/api";
import { searchTotals } from "@/lib/search/types";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const query = (sp.q ?? "").trim();
  const results = await globalSearch(query);
  const { total, hasAnyError } = searchTotals(results);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Search</h1>

      {!query ? (
        <p data-testid="search-prompt" className="mt-4 text-sm text-zinc-500">
          Type a query in the header search box to find providers, services and
          offers.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-zinc-500">
            {total} result{total === 1 ? "" : "s"} for{" "}
            <span className="font-medium text-zinc-700">“{query}”</span>
          </p>

          {total === 0 && !hasAnyError && (
            <div
              data-testid="search-empty"
              className="mt-6 rounded border border-zinc-200 bg-surface-1 p-6 text-sm text-zinc-500"
            >
              Nothing matched “{query}”.
            </div>
          )}

          <section className="mt-6" data-testid="search-group-providers">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Providers ({results.providers.total})
            </h2>
            {results.providers.error ? (
              <div
                data-testid="search-providers-error"
                className="mt-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                Failed to search providers: {results.providers.error}
              </div>
            ) : results.providers.items.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-400">No matching providers.</p>
            ) : (
              <ul className="mt-2 divide-y divide-zinc-100 rounded border border-zinc-200 bg-surface-1">
                {results.providers.items.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/providers/${p.id}`}
                      data-testid={`search-provider-${p.id}`}
                      className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-zinc-50"
                    >
                      <span className="font-medium text-zinc-800">{p.name}</span>
                      <span className="text-xs text-zinc-400">
                        #{p.id} · {p.verification_status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-6" data-testid="search-group-services">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Services ({results.services.total})
            </h2>
            {results.services.error ? (
              <div
                data-testid="search-services-error"
                className="mt-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                Failed to search services: {results.services.error}
              </div>
            ) : results.services.items.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-400">No matching services.</p>
            ) : (
              <ul className="mt-2 divide-y divide-zinc-100 rounded border border-zinc-200 bg-surface-1">
                {results.services.items.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/services/${s.id}`}
                      data-testid={`search-service-${s.id}`}
                      className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-zinc-50"
                    >
                      <span className="font-medium text-zinc-800">
                        {s.title}
                        {s.provider_name ? (
                          <span className="ml-2 font-normal text-zinc-400">
                            {s.provider_name}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-xs text-zinc-400">
                        #{s.id} · {s.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-6" data-testid="search-group-offers">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Offers ({results.offers.total})
            </h2>
            {results.offers.error ? (
              <div
                data-testid="search-offers-error"
                className="mt-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                Failed to search offers: {results.offers.error}
              </div>
            ) : results.offers.items.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-400">No matching offers.</p>
            ) : (
              <ul className="mt-2 divide-y divide-zinc-100 rounded border border-zinc-200 bg-surface-1">
                {results.offers.items.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/offers/${o.id}`}
                      data-testid={`search-offer-${o.id}`}
                      className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-zinc-50"
                    >
                      <span className="font-medium text-zinc-800">
                        {o.title}
                        {o.service_title ? (
                          <span className="ml-2 font-normal text-zinc-400">
                            {o.service_title}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-xs text-zinc-400">
                        #{o.id} · {o.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
