import { formatDateTime } from "@/lib/format";
import type { ProviderDetail } from "@/lib/providers/types";
import StatusBadge from "../../_components/StatusBadge";
import Alert from "@/app/_components/ui/Alert";

export default function ProviderDetailView({ provider }: { provider: ProviderDetail }) {
  return (
    <div className="space-y-5 rounded-lg border border-hairline bg-surface-1 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold" data-testid="provider-detail-title">
            {provider.name}
          </h1>
          <p className="text-sm text-ink-subtle">
            {provider.contact_email ?? "no contact email"}
          </p>
        </div>
        <StatusBadge status={provider.verification_status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-ink-subtle">Provider ID</dt>
          <dd className="text-ink font-mono text-xs">{provider.id}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Services</dt>
          <dd className="text-ink">{provider.services_count}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Active offers</dt>
          <dd className="text-ink">{provider.active_offers_count}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Location</dt>
          <dd className="text-ink">
            {provider.location_name ??
              (provider.location_id !== null ? `#${provider.location_id}` : "—")}
          </dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Phone</dt>
          <dd className="text-ink">{provider.phone ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Website</dt>
          <dd className="text-ink break-all">{provider.website ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Created</dt>
          <dd className="text-ink">{formatDateTime(provider.created_at)}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Updated</dt>
          <dd className="text-ink">{formatDateTime(provider.updated_at)}</dd>
        </div>
      </dl>
      {provider.description ? (
        <div>
          <h2 className="text-sm font-medium text-ink-subtle">Description</h2>
          <p className="mt-1 whitespace-pre-line text-sm text-ink-muted">{provider.description}</p>
        </div>
      ) : null}
      {provider.verification_message ? (
        <Alert tone="success">
          <p className="text-xs font-medium uppercase tracking-wide">
            Verification note
          </p>
          <p className="mt-1">{provider.verification_message}</p>
        </Alert>
      ) : null}
      {provider.block_reason ? (
        <Alert tone="danger">
          <p className="text-xs font-medium uppercase tracking-wide">
            Block reason
          </p>
          <p className="mt-1">{provider.block_reason}</p>
        </Alert>
      ) : null}
    </div>
  );
}
