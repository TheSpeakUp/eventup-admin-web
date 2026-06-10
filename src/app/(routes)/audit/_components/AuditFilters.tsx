"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 300;

// `success` rides the querystring as the string "true"/"false"; the page maps
// it back to a boolean for the backend `success` filter. "All" clears it.
const SUCCESS_OPTIONS = [
  { value: "", label: "All outcomes" },
  { value: "true", label: "Success" },
  { value: "false", label: "Failure" },
] as const;

export default function AuditFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  // Free-text fields are debounced; the success select is immediate.
  const [actor, setActor] = useState(params.get("actor_email") ?? "");
  const [action, setAction] = useState(params.get("action") ?? "");
  const [entityType, setEntityType] = useState(params.get("entity_type") ?? "");
  const lastPushed = useRef<string>(params.toString());

  const success = params.get("success") ?? "";

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

  // Debounce the three free-text fields together; any change resets offset.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      const setOrDelete = (key: string, value: string) => {
        if (value) next.set(key, value);
        else next.delete(key);
      };
      setOrDelete("actor_email", actor);
      setOrDelete("action", action);
      setOrDelete("entity_type", entityType);
      next.delete("offset");
      const serialized = next.toString();
      if (serialized === lastPushed.current) return;
      lastPushed.current = serialized;
      startTransition(() => {
        router.replace(`${pathname}${serialized ? `?${serialized}` : ""}`);
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [actor, action, entityType, params, pathname, router]);

  return (
    <div
      className="flex flex-wrap items-center gap-3"
      data-testid="audit-filters"
      data-pending={pending ? "true" : "false"}
    >
      <input
        type="search"
        value={actor}
        onChange={(e) => setActor(e.target.value)}
        placeholder="Actor email…"
        data-testid="audit-actor-filter"
        className="h-9 w-56 rounded-md border border-zinc-300 px-3 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
      />
      <input
        type="search"
        value={action}
        onChange={(e) => setAction(e.target.value)}
        placeholder="Action…"
        data-testid="audit-action-filter"
        className="h-9 w-48 rounded-md border border-zinc-300 px-3 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
      />
      <input
        type="search"
        value={entityType}
        onChange={(e) => setEntityType(e.target.value)}
        placeholder="Entity type…"
        data-testid="audit-entity-filter"
        className="h-9 w-44 rounded-md border border-zinc-300 px-3 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
      />
      <select
        value={success}
        data-testid="audit-success-filter"
        onChange={(e) =>
          pushImmediate((next) => {
            if (e.target.value) next.set("success", e.target.value);
            else next.delete("success");
          })
        }
        className="h-9 rounded-md border border-zinc-300 px-2 text-sm focus:border-zinc-500 focus:outline-none"
      >
        {SUCCESS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
