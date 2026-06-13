import { formatDateTime } from "@/lib/format";
import type { ProviderDetail } from "@/lib/providers/types";
import StatusBadge from "../../_components/StatusBadge";

export default function ProviderDetailView({ provider }: { provider: ProviderDetail }) {
  return (
    <div className="space-y-5 rounded-md border border-zinc-200 bg-surface-1 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold" data-testid="provider-detail-title">
            {provider.name}
          </h1>
          <p className="text-sm text-zinc-500">
            {provider.contact_email ?? "no contact email"}
          </p>
        </div>
        <StatusBadge status={provider.verification_status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-zinc-500">Provider ID</dt>
          <dd className="text-zinc-900 font-mono text-xs">{provider.id}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Services</dt>
          <dd className="text-zinc-900">{provider.services_count}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Active offers</dt>
          <dd className="text-zinc-900">{provider.active_offers_count}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Location</dt>
          <dd className="text-zinc-900">
            {provider.location_name ??
              (provider.location_id !== null ? `#${provider.location_id}` : "—")}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Phone</dt>
          <dd className="text-zinc-900">{provider.phone ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Website</dt>
          <dd className="text-zinc-900 break-all">{provider.website ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Created</dt>
          <dd className="text-zinc-900">{formatDateTime(provider.created_at)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Updated</dt>
          <dd className="text-zinc-900">{formatDateTime(provider.updated_at)}</dd>
        </div>
      </dl>
      {provider.description ? (
        <div>
          <h2 className="text-sm font-medium text-zinc-500">Description</h2>
          <p className="mt-1 whitespace-pre-line text-sm text-zinc-800">{provider.description}</p>
        </div>
      ) : null}
      {provider.verification_message ? (
        <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-300">
            Verification note
          </p>
          <p className="mt-1">{provider.verification_message}</p>
        </div>
      ) : null}
      {provider.block_reason ? (
        <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-300">
          <p className="text-xs font-medium uppercase tracking-wide text-red-300">
            Block reason
          </p>
          <p className="mt-1">{provider.block_reason}</p>
        </div>
      ) : null}
    </div>
  );
}
