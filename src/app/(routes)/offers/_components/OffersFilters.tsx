"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { QUEUE_STATUSES, type QueueStatus } from "@/lib/offers/types";

const INPUT =
  "h-9 w-24 rounded-md border border-hairline bg-surface-2 px-2 text-sm text-ink focus:border-hairline-strong focus:outline-none";

export default function OffersFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [serviceId, setServiceId] = useState(params.get("service_id") ?? "");
  const [providerId, setProviderId] = useState(params.get("provider_id") ?? "");
  const [minHours, setMinHours] = useState(params.get("min_waiting_hours") ?? "");
  const [maxHours, setMaxHours] = useState(params.get("max_waiting_hours") ?? "");
  const [queue, setQueue] = useState<Set<QueueStatus>>(
    new Set(params.getAll("queue_status") as QueueStatus[]),
  );

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (serviceId) next.set("service_id", serviceId);
    if (providerId) next.set("provider_id", providerId);
    if (minHours) next.set("min_waiting_hours", minHours);
    if (maxHours) next.set("max_waiting_hours", maxHours);
    for (const q of queue) next.append("queue_status", q);
    // Preserve the active view across an Apply.
    const view = params.get("view");
    if (view) next.set("view", view);
    router.push(`/offers?${next.toString()}`);
  }

  function toggle(q: QueueStatus) {
    const next = new Set(queue);
    if (next.has(q)) next.delete(q);
    else next.add(q);
    setQueue(next);
  }

  return (
    <form
      data-testid="offers-filters"
      onSubmit={apply}
      className="flex flex-wrap items-end gap-3"
    >
      <label className="flex flex-col gap-1 text-xs text-ink-subtle">
        Service ID
        <input
          data-testid="filter-service-id"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className={INPUT}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink-subtle">
        Provider ID
        <input
          data-testid="filter-provider-id"
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          className={INPUT}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink-subtle">
        Waiting hours
        <span className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            placeholder="min"
            data-testid="filter-min-hours"
            value={minHours}
            onChange={(e) => setMinHours(e.target.value)}
            className={INPUT}
          />
          <span className="text-ink-tertiary">→</span>
          <input
            type="number"
            min={0}
            placeholder="max"
            data-testid="filter-max-hours"
            value={maxHours}
            onChange={(e) => setMaxHours(e.target.value)}
            className={INPUT}
          />
        </span>
      </label>
      <div className="flex flex-col gap-1 text-xs text-ink-subtle">
        Queue status
        <div className="flex flex-wrap gap-1">
          {QUEUE_STATUSES.map((q) => (
            <button
              type="button"
              key={q}
              data-testid={`filter-queue-${q}`}
              data-active={queue.has(q) ? "true" : "false"}
              onClick={() => toggle(q)}
              className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                queue.has(q)
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-ink-subtle hover:text-ink"
              }`}
            >
              {q.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>
      <button
        type="submit"
        data-testid="filter-apply"
        className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Apply
      </button>
    </form>
  );
}
