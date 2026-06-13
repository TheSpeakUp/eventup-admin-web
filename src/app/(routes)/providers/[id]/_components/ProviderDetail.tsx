import { formatDateTime } from "@/lib/format";
import type { ProviderEvidenceType, ProviderDetail } from "@/lib/providers/types";
import StatusBadge from "../../_components/StatusBadge";

const EVIDENCE_LABELS: Record<ProviderEvidenceType, string> = {
  identity_document: "Identity document",
  selfie: "Selfie",
  org_document: "Organization document",
};

// Evidence `file_url` is provider-influenced data flowing into an admin's
// browser. React escapes text but NOT an `href` scheme, so render a link only
// when the URL is http(s) — blocks `javascript:`/`data:` URI injection (XSS).
function safeHttpUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

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
      <div data-testid="provider-evidence">
        <h2 className="text-sm font-medium text-zinc-500">Verification evidence</h2>
        {provider.verification_evidence.length === 0 ? (
          <p
            data-testid="provider-evidence-empty"
            className="mt-1 text-sm text-zinc-400"
          >
            No verification evidence uploaded.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {provider.verification_evidence.map((ev) => {
              const href = safeHttpUrl(ev.file_url);
              return (
                <li
                  key={ev.id}
                  data-testid="provider-evidence-item"
                  className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-800">
                      {EVIDENCE_LABELS[ev.evidence_type] ?? ev.evidence_type}
                    </p>
                    {ev.caption ? (
                      <p className="truncate text-xs text-zinc-500">{ev.caption}</p>
                    ) : null}
                    <p className="text-xs text-zinc-400">
                      {formatDateTime(ev.created_at)}
                    </p>
                  </div>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="provider-evidence-link"
                      className="shrink-0 text-primary hover:underline"
                    >
                      View
                    </a>
                  ) : (
                    <span
                      data-testid="provider-evidence-link-invalid"
                      title={ev.file_url}
                      className="shrink-0 text-xs text-zinc-400"
                    >
                      Invalid link
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {provider.verification_message ? (
        <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Verification note
          </p>
          <p className="mt-1">{provider.verification_message}</p>
        </div>
      ) : null}
      {provider.block_reason ? (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-900">
          <p className="text-xs font-medium uppercase tracking-wide text-red-700">
            Block reason
          </p>
          <p className="mt-1">{provider.block_reason}</p>
        </div>
      ) : null}
    </div>
  );
}
