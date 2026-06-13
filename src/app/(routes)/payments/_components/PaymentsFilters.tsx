"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/app/_components/ui";

// Currencies offered in the filter dropdown. The backend accepts any currency
// string, but the operator UI only needs the ones the marketplace charges in;
// "All" clears the filter.
const CURRENCIES = ["USD", "EUR", "GBP", "AED", "JPY"] as const;

export default function PaymentsFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  // Currency + the created date range are immediate; search `q` is owned by
  // SearchInput.
  const currency = params.get("currency") ?? "";
  const createdFrom = params.get("created_from") ?? "";
  const createdTo = params.get("created_to") ?? "";
  const controlClass =
    "h-9 rounded-md border border-hairline bg-surface-2 px-2 text-sm text-ink focus:border-hairline-strong focus:outline-none";

  function setParam(key: string, value: string): void {
    pushImmediate((next) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
  }

  function pushImmediate(mutate: (next: URLSearchParams) => void): void {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("offset");
    const serialized = next.toString();
    startTransition(() => {
      router.replace(`${pathname}${serialized ? `?${serialized}` : ""}`);
    });
  }

  return (
    <div
      className="flex flex-wrap items-center gap-3"
      data-testid="payments-filters"
      data-pending={pending ? "true" : "false"}
    >
      <SearchInput
        param="q"
        testid="payments-search"
        placeholder="Search provider or service…"
      />
      <select
        value={currency}
        data-testid="payments-currency-filter"
        onChange={(e) => setParam("currency", e.target.value)}
        className={controlClass}
      >
        <option value="">All currencies</option>
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={createdFrom}
          aria-label="Created from"
          data-testid="payments-date-from"
          onChange={(e) => setParam("created_from", e.target.value)}
          className={controlClass}
        />
        <span className="text-xs text-ink-tertiary">→</span>
        <input
          type="date"
          value={createdTo}
          aria-label="Created to"
          data-testid="payments-date-to"
          onChange={(e) => setParam("created_to", e.target.value)}
          className={controlClass}
        />
      </div>
    </div>
  );
}
