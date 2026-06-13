import { formatDateTime } from "@/lib/format";
import { formatRecipientType, type ServiceDetail } from "@/lib/services/types";
import StatusBadge from "../../_components/StatusBadge";

function formatPrice(minor: number | null, currency: string | null): string {
  if (minor === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: currency ? "currency" : "decimal",
    currency: currency ?? "USD",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export default function ServiceDetailView({ service }: { service: ServiceDetail }) {
  return (
    <div className="space-y-5 rounded-md border border-zinc-200 bg-surface-1 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold" data-testid="service-detail-title">
            {service.title}
          </h1>
          <p className="text-sm text-zinc-500">
            {service.provider_name ?? `Provider #${service.provider_id}`}
            {service.category_id !== null
              ? ` · ${service.category_name ?? `Category #${service.category_id}`}`
              : ""}
          </p>
        </div>
        <StatusBadge status={service.status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-zinc-500">Base price</dt>
          <dd className="text-zinc-900">{formatPrice(service.base_price_minor, service.currency)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Pricing type</dt>
          <dd className="text-zinc-900">{service.pricing_type}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Recipient type</dt>
          <dd className="text-zinc-900">{formatRecipientType(service.recipient_type)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Remote available</dt>
          <dd className="text-zinc-900">{service.remote_available ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Created</dt>
          <dd className="text-zinc-900">{formatDateTime(service.created_at)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Updated</dt>
          <dd className="text-zinc-900">{formatDateTime(service.updated_at)}</dd>
        </div>
      </dl>
      {service.description ? (
        <div>
          <h2 className="text-sm font-medium text-zinc-500">Description</h2>
          <p className="mt-1 whitespace-pre-line text-sm text-zinc-800">{service.description}</p>
        </div>
      ) : null}
    </div>
  );
}
