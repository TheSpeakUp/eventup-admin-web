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

  // Free-text fields are debounced; the success select + date range are
  // immediate.
  const [actor, setActor] = useState(params.get("actor_email") ?? "");
  const [action, setAction] = useState(params.get("action") ?? "");
  const [entityType, setEntityType] = useState(params.get("entity_type") ?? "");
  const [realm, setRealm] = useState(params.get("realm") ?? "");
  const lastPushed = useRef<string>(params.toString());

  const success = params.get("success") ?? "";
  const occurredFrom = params.get("occurred_from") ?? "";
  const occurredTo = params.get("occurred_to") ?? "";

  // Shared Linear-token control styling for inputs/selects.
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
      setOrDelete("realm", realm);
      next.delete("offset");
      const serialized = next.toString();
      if (serialized === lastPushed.current) return;
      lastPushed.current = serialized;
      startTransition(() => {
        router.replace(`${pathname}${serialized ? `?${serialized}` : ""}`);
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [actor, action, entityType, realm, params, pathname, router]);

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
        className="h-9 w-56 rounded-md border border-hairline bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-subtle focus:border-hairline-strong focus:outline-none"
      />
      <input
        type="search"
        value={action}
        onChange={(e) => setAction(e.target.value)}
        placeholder="Action…"
        data-testid="audit-action-filter"
        className="h-9 w-48 rounded-md border border-hairline bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-subtle focus:border-hairline-strong focus:outline-none"
      />
      <input
        type="search"
        value={entityType}
        onChange={(e) => setEntityType(e.target.value)}
        placeholder="Entity type…"
        data-testid="audit-entity-filter"
        className="h-9 w-44 rounded-md border border-hairline bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-subtle focus:border-hairline-strong focus:outline-none"
      />
      <input
        type="search"
        value={realm}
        onChange={(e) => setRealm(e.target.value)}
        placeholder="Realm"
        data-testid="audit-realm-filter"
        className="h-9 w-40 rounded-md border border-hairline bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-subtle focus:border-hairline-strong focus:outline-none"
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
        className={controlClass}
      >
        {SUCCESS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={occurredFrom}
          aria-label="Occurred from"
          data-testid="audit-date-from"
          onChange={(e) => setParam("occurred_from", e.target.value)}
          className={controlClass}
        />
        <span className="text-xs text-ink-tertiary">→</span>
        <input
          type="date"
          value={occurredTo}
          aria-label="Occurred to"
          data-testid="audit-date-to"
          onChange={(e) => setParam("occurred_to", e.target.value)}
          className={controlClass}
        />
      </div>
    </div>
  );
}
