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

  // Currency is select-driven (immediate); search `q` is owned by SearchInput.
  const currency = params.get("currency") ?? "";

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
        onChange={(e) =>
          pushImmediate((next) => {
            if (e.target.value) next.set("currency", e.target.value);
            else next.delete("currency");
          })
        }
        className="h-9 rounded-md border border-hairline bg-surface-2 px-2 text-sm text-ink focus:border-hairline-strong focus:outline-none"
      >
        <option value="">All currencies</option>
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
