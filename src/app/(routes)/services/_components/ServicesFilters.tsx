"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SERVICE_STATUSES, type ServiceStatus } from "@/lib/services/types";
import { Input, Select } from "@/app/_components/ui/FormField";

const DEBOUNCE_MS = 300;

export default function ServicesFilters() {
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

  function onStatusChange(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("status", value);
    else next.delete("status");
    next.delete("last_id");
    lastPushed.current = next.toString();
    startTransition(() => {
      router.replace(`${pathname}${next.toString() ? `?${next.toString()}` : ""}`);
    });
  }

  const status = params.get("status") ?? "";

  return (
    <div
      className="flex items-center gap-3"
      data-testid="services-filters"
      data-pending={pending ? "true" : "false"}
    >
      <Input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search services…"
        data-testid="services-search"
        className="w-64"
      />
      <Select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        data-testid="services-status-filter"
        className="w-auto"
      >
        <option value="">All statuses</option>
        {SERVICE_STATUSES.map((s) => {
          const v: ServiceStatus = s;
          return (
            <option key={s} value={v}>
              {s.replace("_", " ")}
            </option>
          );
        })}
      </Select>
    </div>
  );
}
