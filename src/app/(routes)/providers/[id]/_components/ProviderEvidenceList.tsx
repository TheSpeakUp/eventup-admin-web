import { formatDateTime } from "@/lib/format";
import type {
  ProviderEvidenceType,
  ProviderVerificationEvidence,
} from "@/lib/providers/types";

// Human labels for the kind-appropriate evidence types (backend T4). Unknown
// values fall back to the raw key so a future server-side type still renders.
const EVIDENCE_LABELS: Record<ProviderEvidenceType, string> = {
  identity_document: "Identity document",
  selfie: "Selfie",
  org_document: "Organization document",
};

function labelFor(type: string): string {
  return EVIDENCE_LABELS[type as ProviderEvidenceType] ?? type;
}

export default function ProviderEvidenceList({
  evidence,
}: {
  evidence: ProviderVerificationEvidence[];
}) {
  return (
    <div
      className="space-y-3 rounded-md border border-zinc-200 bg-white p-6"
      data-testid="provider-evidence"
    >
      <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        Verification evidence
      </h2>
      {evidence.length === 0 ? (
        <p data-testid="provider-evidence-empty" className="text-sm text-zinc-500">
          No documents submitted. Verify will be rejected unless you use the
          override option in the verify dialog.
        </p>
      ) : (
        <ul className="space-y-2" data-testid="provider-evidence-list">
          {evidence.map((doc) => (
            <li
              key={doc.id}
              data-testid="provider-evidence-item"
              className="flex items-start justify-between gap-3 rounded-md border border-zinc-100 bg-zinc-50 p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-zinc-900">
                  {labelFor(doc.evidence_type)}
                </p>
                {doc.caption ? (
                  <p className="text-zinc-600">{doc.caption}</p>
                ) : null}
                <p className="mt-0.5 text-xs text-zinc-400">
                  {formatDateTime(doc.created_at)}
                </p>
              </div>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="provider-evidence-link"
                className="shrink-0 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              >
                View
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
