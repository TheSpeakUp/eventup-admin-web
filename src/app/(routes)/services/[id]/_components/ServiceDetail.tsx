import type { ServiceDetail } from "@/lib/services/types";
import StatusBadge from "../../_components/StatusBadge";

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16).replace("T", " ");
}

export default function ServiceDetailView({ service }: { service: ServiceDetail }) {
  return (
    <div className="space-y-5 rounded-md border border-zinc-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold" data-testid="service-detail-title">
            {service.title}
          </h1>
          <p className="text-sm text-zinc-500">
            {service.provider_name} · {service.category}
          </p>
        </div>
        <StatusBadge status={service.status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-zinc-500">Price</dt>
          <dd className="text-zinc-900">{formatPrice(service.price_cents, service.currency)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Provider ID</dt>
          <dd className="text-zinc-900 font-mono text-xs">{service.provider_id}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Created</dt>
          <dd className="text-zinc-900">{formatDate(service.created_at)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Updated</dt>
          <dd className="text-zinc-900">{formatDate(service.updated_at)}</dd>
        </div>
      </dl>
      <div>
        <h2 className="text-sm font-medium text-zinc-500">Description</h2>
        <p className="mt-1 whitespace-pre-line text-sm text-zinc-800">{service.description}</p>
      </div>
      {service.last_moderation_note ? (
        <div className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Last moderation note
          </p>
          <p className="mt-1">{service.last_moderation_note}</p>
          {service.last_moderator_email ? (
            <p className="mt-1 text-xs text-zinc-500">— {service.last_moderator_email}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
