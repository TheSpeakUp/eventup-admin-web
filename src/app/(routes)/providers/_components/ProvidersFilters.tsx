"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 300;

export default function ProvidersFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const lastPushed = useRef<string>(params.toString());

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (search) next.set("search", search);
      else next.delete("search");
      next.delete("last_id");
      const serialized = next.toString();
      if (serialized === lastPushed.current) return;
      lastPushed.current = serialized;
      startTransition(() => {
        router.replace(`${pathname}${serialized ? `?${serialized}` : ""}`);
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [search, params, pathname, router]);

  return (
    <div
      className="flex items-center gap-3"
      data-testid="providers-filters"
      data-pending={pending ? "true" : "false"}
    >
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search providers…"
        data-testid="providers-search"
        className="h-9 w-64 rounded-md border border-zinc-300 px-3 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
      />
    </div>
  );
}
