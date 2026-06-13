"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PAYMENT_STATUSES } from "@/lib/payments/types";
import { Input, Select } from "@/app/_components/ui/FormField";

const DEBOUNCE_MS = 300;

// Currencies offered in the filter dropdown. The backend accepts any currency
// string, but the operator UI only needs the ones the marketplace charges in;
// "All" clears the filter.
const CURRENCIES = ["USD", "EUR", "GBP", "AED", "JPY"] as const;

export default function PaymentsFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const lastPushed = useRef<string>(params.toString());

  // Status + currency are select-driven (immediate), search `q` is debounced.
  const status = params.get("status") ?? "";
  const currency = params.get("currency") ?? "";

  function pushImmediate(mutate: (next: URLSearchParams) => void): void {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("offset");
    const serialized = next.toString();
    lastPushed.current = serialized;
    startTransition(() => {
      router.replace(`${pathname}${serialized ? `?${serialized}` : ""}`);
    });
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (q) next.set("q", q);
      else next.delete("q");
      next.delete("offset");
      const serialized = next.toString();
      if (serialized === lastPushed.current) return;
      lastPushed.current = serialized;
      startTransition(() => {
        router.replace(`${pathname}${serialized ? `?${serialized}` : ""}`);
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [q, params, pathname, router]);

  return (
    <div
      className="flex flex-wrap items-center gap-3"
      data-testid="payments-filters"
      data-pending={pending ? "true" : "false"}
    >
      <Input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search provider or service…"
        data-testid="payments-search"
        className="w-64"
      />
      <Select
        value={status}
        data-testid="payments-status-filter"
        onChange={(e) =>
          pushImmediate((next) => {
            if (e.target.value) next.set("status", e.target.value);
            else next.delete("status");
          })
        }
        className="w-auto"
      >
        <option value="">All statuses</option>
        {PAYMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </Select>
      <Select
        value={currency}
        data-testid="payments-currency-filter"
        onChange={(e) =>
          pushImmediate((next) => {
            if (e.target.value) next.set("currency", e.target.value);
            else next.delete("currency");
          })
        }
        className="w-auto"
      >
        <option value="">All currencies</option>
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
    </div>
  );
}
