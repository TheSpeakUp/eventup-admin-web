export const PROVIDER_STATUSES = [
  "pending",
  "verified",
  "blocked",
  "canceled",
] as const;

export type ProviderStatus = (typeof PROVIDER_STATUSES)[number];

export function isProviderStatus(value: string): value is ProviderStatus {
  return (PROVIDER_STATUSES as readonly string[]).includes(value);
}

// Kind-appropriate evidence types (backend T4). talent → identity_document |
// selfie; company → org_document. The admin detail response does NOT expose
// provider_kind, so the UI renders these generically and relies on the verify
// 400 message to tell the moderator which doc is missing.
export const PROVIDER_EVIDENCE_TYPES = [
  "identity_document",
  "selfie",
  "org_document",
] as const;

export type ProviderEvidenceType = (typeof PROVIDER_EVIDENCE_TYPES)[number];

export type ProviderVerificationEvidence = {
  id: number;
  evidence_type: ProviderEvidenceType;
  file_url: string;
  caption: string | null;
  created_at: string;
};

export type ProviderListItem = {
  id: number;
  name: string;
  verification_status: ProviderStatus;
  location_id: number | null;
  services_count: number;
  active_offers_count: number;
  created_at: string;
  updated_at: string;
};

export type ProviderDetail = ProviderListItem & {
  // Resolved location label (backend PR #93) — detail-only; null when unset/unsynced.
  location_name: string | null;
  description: string | null;
  contact_email: string | null;
  phone: string | null;
  website: string | null;
  // Editable DATA fields (M7 field-edit) — account_currency is NON-nullable;
  // address / logo_url are nullable-clearable.
  account_currency: string;
  address: string | null;
  logo_url: string | null;
  verification_message: string | null;
  block_reason: string | null;
  // Submitted verification documents (backend T4). Always present (defaults to
  // [] server-side); the moderator reviews these before verifying.
  verification_evidence: ProviderVerificationEvidence[];
};

/**
 * Partial DATA-field update body for `PATCH /providers/{id}/fields` (M7).
 *
 * Mirrors backend `ProviderFieldsUpdate`: every key is OPTIONAL. Semantics:
 *  - key OMITTED → leave unchanged;
 *  - key present with a value → set;
 *  - key present with `null` → clear (nullable columns only).
 *
 * `name` and `account_currency` are NON-nullable: an explicit `null` is rejected
 * by the backend with a 400 — the form never sends `null` for those.
 */
export type ProviderFieldsPatch = {
  name?: string;
  description?: string | null;
  website?: string | null;
  account_currency?: string;
  location_id?: number | null;
  address?: string | null;
  logo_url?: string | null;
};

export type ProviderCursorPage = {
  items: ProviderListItem[];
  next_last_id: number | null;
  has_more: boolean;
  count: number;
};

export type ProviderListQuery = {
  search?: string;
  last_id?: number;
  limit?: number;
};

export type ProviderModerationResponse = {
  provider_id: number;
  new_status: ProviderStatus;
  message_key: string | null;
  message: string;
};

export type ProviderStats = {
  provider_id: number;
  total_services: number;
  services_by_status: Record<string, number>;
  active_offers_count: number;
};
