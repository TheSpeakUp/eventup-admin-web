import type { ProviderDetail } from "@/lib/providers/types";
import StatusBadge from "../../_components/StatusBadge";

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16).replace("T", " ");
}

export default function ProviderDetailView({ provider }: { provider: ProviderDetail }) {
  return (
    <div className="space-y-5 rounded-md border border-zinc-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold" data-testid="provider-detail-title">
            {provider.name}
          </h1>
          <p className="text-sm text-zinc-500">
            {provider.contact_email} · {provider.category}
          </p>
        </div>
        <StatusBadge status={provider.status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-zinc-500">Provider ID</dt>
          <dd className="text-zinc-900 font-mono text-xs">{provider.id}</dd>
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
          <dt className="text-zinc-500">Category</dt>
          <dd className="text-zinc-900">{provider.category}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Created</dt>
          <dd className="text-zinc-900">{formatDate(provider.created_at)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Updated</dt>
          <dd className="text-zinc-900">{formatDate(provider.updated_at)}</dd>
        </div>
      </dl>
      <div>
        <h2 className="text-sm font-medium text-zinc-500">Description</h2>
        <p className="mt-1 whitespace-pre-line text-sm text-zinc-800">{provider.description}</p>
      </div>
      {provider.last_moderation_note ? (
        <div className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Last moderation note
          </p>
          <p className="mt-1">{provider.last_moderation_note}</p>
          {provider.last_moderator_email ? (
            <p className="mt-1 text-xs text-zinc-500">— {provider.last_moderator_email}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
