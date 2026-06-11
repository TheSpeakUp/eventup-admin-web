// src/lib/quality/types.ts
//
// Typed mirror of the backend M4 quality / ranking schemas
// (src/eventup/admin/marketplace/quality_admin_schemas.py). Quality scores are
// plain floats (kept as `number`); the JSON columns (quality_badges,
// anomaly_flags, config_json, payload_json) are exposed as arrays / records.
// No money / Decimal here, so nothing is a string. The manual-override
// coefficient is a plain float bounded (0, 10] on the backend.

export const QUALITY_TABS = [
  "services",
  "providers",
  "formula-configs",
  "anomalies",
] as const;
export type QualityTab = (typeof QUALITY_TABS)[number];

export function isQualityTab(value: string): value is QualityTab {
  return (QUALITY_TABS as readonly string[]).includes(value);
}

// --------------------------------------------------------------------------- //
// Service quality metrics — list + detail + override set/clear                 //
// --------------------------------------------------------------------------- //

export type ServiceQualityMetricRead = {
  service_id: number;
  provider_id: number;
  // Resolved labels (admin polish) — null when the referenced row is gone.
  service_title: string | null;
  provider_name: string | null;
  formula_version: string;
  trust_score: number;
  ranking_score: number;
  quality_tier: string;
  quality_badges: string[];
  conversion_score: number;
  response_score: number;
  cancellation_quality: number;
  complaint_quality: number;
  anti_gaming_coefficient: number;
  anomaly_score: number;
  anomaly_flags: string[];
  manual_override_coefficient: number | null;
  manual_override_reason: string | null;
  manual_override_until: string | null; // ISO datetime
  favorites_total: number;
  reservations_total: number;
  reservations_converted: number;
  reservations_failed: number;
  complaints_total: number;
  sla_breaches: number;
  sla_activity_total: number;
  computed_at: string;
  updated_at: string;
};

export type ServiceQualityListResponse = {
  items: ServiceQualityMetricRead[];
  total: number;
};

export type ServiceQualityListQuery = {
  quality_tier?: string;
  provider_id?: number;
  has_override?: boolean;
  sort_by?: string;
  sort_dir?: string;
  limit?: number;
  offset?: number;
};

// POST /services/{id}/override body. coefficient bounded (0, 10]; reason
// required so every override is auditable; until optional (null = no expiry).
export type QualityOverrideSetPayload = {
  coefficient: number;
  reason: string;
  until?: string | null;
};

// --------------------------------------------------------------------------- //
// Provider quality metrics — list + detail (read-only)                         //
// --------------------------------------------------------------------------- //

export type ProviderQualityMetricRead = {
  provider_id: number;
  // Resolved label (admin polish).
  provider_name: string | null;
  formula_version: string;
  trust_score: number;
  verification_score: number;
  rating_score: number;
  services_count: number;
  active_services_count: number;
  reservations_total: number;
  reservations_failed: number;
  complaints_total: number;
  sla_breaches: number;
  sla_activity_total: number;
  computed_at: string;
  updated_at: string;
};

export type ProviderQualityListResponse = {
  items: ProviderQualityMetricRead[];
  total: number;
};

export type ProviderQualityListQuery = {
  sort_by?: string;
  sort_dir?: string;
  limit?: number;
  offset?: number;
};

// --------------------------------------------------------------------------- //
// Formula configs — list + detail + activate + rollback                        //
// --------------------------------------------------------------------------- //

export type FormulaConfigRead = {
  id: number;
  version: string;
  description: string | null;
  config_json: Record<string, unknown>;
  is_active: boolean;
  created_by_admin_id: number | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FormulaConfigListResponse = {
  items: FormulaConfigRead[];
  total: number;
};

export type FormulaConfigListQuery = {
  limit?: number;
  offset?: number;
};

// --------------------------------------------------------------------------- //
// Anomaly events — list (resolved filter) + detail + review                    //
// --------------------------------------------------------------------------- //
// "Reviewed" == resolved_at IS NOT NULL on the backend; the list filter param
// is `resolved` (bool).

export type AnomalyEventRead = {
  id: number;
  service_id: number;
  provider_id: number;
  event_type: string;
  severity: string;
  reason_code: string;
  coefficient: number;
  payload_json: Record<string, unknown> | null;
  detected_at: string;
  resolved_at: string | null;
  resolved_by_admin_id: number | null;
};

export type AnomalyListResponse = {
  items: AnomalyEventRead[];
  total: number;
};

export type AnomalyListQuery = {
  service_id?: number;
  provider_id?: number;
  severity?: string;
  event_type?: string;
  resolved?: boolean;
  limit?: number;
  offset?: number;
};

// POST /anomalies/{id}/review body — note is optional (free-form, forwarded
// only into audit metadata; the row only gets resolved_at stamped).
export type AnomalyReviewPayload = {
  note?: string | null;
};
