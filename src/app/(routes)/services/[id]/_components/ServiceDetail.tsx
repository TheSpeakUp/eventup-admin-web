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
    <div className="space-y-5 rounded-lg border border-hairline bg-surface-1 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink" data-testid="service-detail-title">
            {service.title}
          </h1>
          <p className="text-sm text-ink-subtle">
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
          <dt className="text-ink-subtle">Base price</dt>
          <dd className="text-ink">{formatPrice(service.base_price_minor, service.currency)}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Pricing type</dt>
          <dd className="text-ink">{service.pricing_type}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Recipient type</dt>
          <dd className="text-ink">{formatRecipientType(service.recipient_type)}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Remote available</dt>
          <dd className="text-ink">{service.remote_available ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Created</dt>
          <dd className="text-ink">{formatDateTime(service.created_at)}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Updated</dt>
          <dd className="text-ink">{formatDateTime(service.updated_at)}</dd>
        </div>
      </dl>
      {service.description ? (
        <div>
          <h2 className="text-sm font-medium text-ink-subtle">Description</h2>
          <p className="mt-1 whitespace-pre-line text-sm text-ink-muted">{service.description}</p>
        </div>
      ) : null}
    </div>
  );
}
