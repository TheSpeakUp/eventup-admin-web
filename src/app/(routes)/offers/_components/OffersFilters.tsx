"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { QUEUE_STATUSES, type QueueStatus } from "@/lib/offers/types";
import { FormField, Input } from "@/app/_components/ui/FormField";
import Button from "@/app/_components/ui/Button";

export default function OffersFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [serviceId, setServiceId] = useState(params.get("service_id") ?? "");
  const [providerId, setProviderId] = useState(params.get("provider_id") ?? "");
  const [minHours, setMinHours] = useState(params.get("min_waiting_hours") ?? "");
  const [queue, setQueue] = useState<Set<QueueStatus>>(
    new Set((params.getAll("queue_status") as QueueStatus[])),
  );

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (serviceId) next.set("service_id", serviceId);
    if (providerId) next.set("provider_id", providerId);
    if (minHours) next.set("min_waiting_hours", minHours);
    for (const q of queue) next.append("queue_status", q);
    router.push(`/offers?${next.toString()}`);
  }

  function toggle(q: QueueStatus) {
    const next = new Set(queue);
    if (next.has(q)) next.delete(q);
    else next.add(q);
    setQueue(next);
  }

  return (
    <form data-testid="offers-filters" onSubmit={apply} className="flex flex-wrap items-end gap-3 rounded-lg border border-hairline bg-surface-1 p-3">
      <FormField htmlFor="filter-service-id" label="Service ID">
        <Input id="filter-service-id" data-testid="filter-service-id" value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="w-40" />
      </FormField>
      <FormField htmlFor="filter-provider-id" label="Provider ID">
        <Input id="filter-provider-id" data-testid="filter-provider-id" value={providerId} onChange={(e) => setProviderId(e.target.value)} className="w-40" />
      </FormField>
      <FormField htmlFor="filter-min-hours" label="Min waiting hours">
        <Input id="filter-min-hours" data-testid="filter-min-hours" value={minHours} onChange={(e) => setMinHours(e.target.value)} className="w-40" />
      </FormField>
      <div className="flex flex-col gap-1 text-xs">
        <span className="text-sm font-medium text-ink-muted">Queue status</span>
        <div className="flex flex-wrap gap-1">
          {QUEUE_STATUSES.map((q) => (
            <button
              type="button"
              key={q}
              data-testid={`filter-queue-${q}`}
              data-active={queue.has(q) ? "true" : "false"}
              onClick={() => toggle(q)}
              className={`rounded-full border px-2 py-0.5 text-xs ${queue.has(q) ? "border-primary bg-primary text-white" : "border-hairline bg-surface-1 text-ink-muted hover:border-hairline-strong"}`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" data-testid="filter-apply">
        Apply
      </Button>
    </form>
  );
}
