// src/mocks/quality-fixtures.ts
//
// Seed data for the M4 quality / ranking mock store. Mirrors the backend Read
// shapes (quality_admin_schemas.py). Scores are plain floats. The JSON columns
// are arrays / records.
import type {
  AnomalyEventRead,
  FormulaConfigRead,
  ProviderQualityMetricRead,
  ServiceQualityMetricRead,
} from "@/lib/quality/types";

const T0 = new Date("2026-06-01T00:00:00Z").toISOString();

// Service #501 carries an active manual override (exercises the has_override /
// clear path); #502 has none (exercises the set path).
export function buildFixtureServiceMetrics(): ServiceQualityMetricRead[] {
  return [
    {
      service_id: 501,
      provider_id: 201,
      formula_version: "v3",
      trust_score: 0.82,
      ranking_score: 0.91,
      quality_tier: "gold",
      quality_badges: ["fast_responder", "top_rated"],
      conversion_score: 0.74,
      response_score: 0.88,
      cancellation_quality: 0.95,
      complaint_quality: 0.9,
      anti_gaming_coefficient: 1.0,
      anomaly_score: 0.05,
      anomaly_flags: [],
      manual_override_coefficient: 1.25,
      manual_override_reason: "Editorial boost for launch week",
      manual_override_until: "2026-07-01T00:00:00Z",
      favorites_total: 320,
      reservations_total: 140,
      reservations_converted: 104,
      reservations_failed: 6,
      complaints_total: 2,
      sla_breaches: 1,
      sla_activity_total: 130,
      computed_at: T0,
      updated_at: T0,
    },
    {
      service_id: 502,
      provider_id: 202,
      formula_version: "v3",
      trust_score: 0.61,
      ranking_score: 0.58,
      quality_tier: "silver",
      quality_badges: [],
      conversion_score: 0.49,
      response_score: 0.66,
      cancellation_quality: 0.8,
      complaint_quality: 0.72,
      anti_gaming_coefficient: 0.9,
      anomaly_score: 0.31,
      anomaly_flags: ["velocity_spike"],
      manual_override_coefficient: null,
      manual_override_reason: null,
      manual_override_until: null,
      favorites_total: 95,
      reservations_total: 60,
      reservations_converted: 29,
      reservations_failed: 11,
      complaints_total: 5,
      sla_breaches: 3,
      sla_activity_total: 52,
      computed_at: T0,
      updated_at: T0,
    },
  ];
}

export function buildFixtureProviderMetrics(): ProviderQualityMetricRead[] {
  return [
    {
      provider_id: 201,
      formula_version: "v3",
      trust_score: 0.86,
      verification_score: 1.0,
      rating_score: 0.79,
      services_count: 8,
      active_services_count: 6,
      reservations_total: 410,
      reservations_failed: 12,
      complaints_total: 4,
      sla_breaches: 2,
      sla_activity_total: 380,
      computed_at: T0,
      updated_at: T0,
    },
    {
      provider_id: 202,
      formula_version: "v3",
      trust_score: 0.57,
      verification_score: 0.5,
      rating_score: 0.61,
      services_count: 3,
      active_services_count: 2,
      reservations_total: 88,
      reservations_failed: 19,
      complaints_total: 7,
      sla_breaches: 5,
      sla_activity_total: 70,
      computed_at: T0,
      updated_at: T0,
    },
  ];
}

// Two configs: v2 (previous, inactive) and v3 (active). Activating v2 flips the
// active flag to v2; rollback restores v3 → v2 (last-deactivated). The store
// tracks the previous-active id to back rollback.
export function buildFixtureFormulaConfigs(): FormulaConfigRead[] {
  return [
    {
      id: 1,
      version: "v2",
      description: "Legacy weighting (pre-anti-gaming)",
      config_json: { trust_weight: 0.5, ranking_weight: 0.5 },
      is_active: false,
      created_by_admin_id: 1,
      activated_at: null,
      created_at: T0,
      updated_at: T0,
    },
    {
      id: 2,
      version: "v3",
      description: "Current weighting with anti-gaming coefficient",
      config_json: {
        trust_weight: 0.4,
        ranking_weight: 0.4,
        anti_gaming_weight: 0.2,
      },
      is_active: true,
      created_by_admin_id: 1,
      activated_at: T0,
      created_at: T0,
      updated_at: T0,
    },
  ];
}

// Anomaly #1 is unreviewed (resolved_at null); #2 is already reviewed.
export function buildFixtureAnomalies(): AnomalyEventRead[] {
  return [
    {
      id: 1,
      service_id: 502,
      provider_id: 202,
      event_type: "reservation_velocity",
      severity: "high",
      reason_code: "velocity_spike",
      coefficient: 0.7,
      payload_json: { window_minutes: 10, count: 42 },
      detected_at: T0,
      resolved_at: null,
      resolved_by_admin_id: null,
    },
    {
      id: 2,
      service_id: 501,
      provider_id: 201,
      event_type: "favorite_velocity",
      severity: "medium",
      reason_code: "favorite_spike",
      coefficient: 0.85,
      payload_json: { window_minutes: 60, count: 130 },
      detected_at: T0,
      resolved_at: new Date("2026-06-02T00:00:00Z").toISOString(),
      resolved_by_admin_id: 1,
    },
  ];
}
