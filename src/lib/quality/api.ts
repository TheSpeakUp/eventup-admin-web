// src/lib/quality/api.ts
//
// Typed client for the M4 quality / ranking admin slice (services / providers
// metrics, formula configs, anomalies). Reads are GETs with query params
// (mirrors promotions/api.ts). Writes (override set/clear, formula
// activate/rollback, anomaly review) pass `redirectOn401:false` so Server
// Actions surface a structured error to the form instead of redirecting. Only
// the methods the backend views expose per entity are wired here — see
// quality_admin_views.py.
import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  AnomalyEventRead,
  AnomalyListQuery,
  AnomalyListResponse,
  AnomalyReviewPayload,
  FormulaConfigListQuery,
  FormulaConfigListResponse,
  FormulaConfigRead,
  ProviderQualityListQuery,
  ProviderQualityListResponse,
  ProviderQualityMetricRead,
  QualityOverrideSetPayload,
  ServiceQualityListQuery,
  ServiceQualityListResponse,
  ServiceQualityMetricRead,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace/quality";

function appendBool(params: URLSearchParams, key: string, v: boolean | undefined) {
  if (v !== undefined) params.set(key, v ? "true" : "false");
}
function appendNum(params: URLSearchParams, key: string, v: number | undefined) {
  if (v !== undefined) params.set(key, String(v));
}
function appendStr(params: URLSearchParams, key: string, v: string | undefined) {
  if (v !== undefined && v !== "") params.set(key, v);
}
function withQs(path: string, params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

// --------------------------------------------------------------------------- //
// Service quality metrics — list, detail, override set (POST) + clear (DELETE) //
// --------------------------------------------------------------------------- //

export function listServiceMetrics(
  query: ServiceQualityListQuery = {},
): Promise<ApiFetchResult<ServiceQualityListResponse>> {
  const params = new URLSearchParams();
  appendStr(params, "quality_tier", query.quality_tier);
  appendNum(params, "provider_id", query.provider_id);
  appendBool(params, "has_override", query.has_override);
  appendStr(params, "sort_by", query.sort_by);
  appendStr(params, "sort_dir", query.sort_dir);
  appendNum(params, "limit", query.limit);
  appendNum(params, "offset", query.offset);
  return apiFetch<ServiceQualityListResponse>(
    withQs(`${BASE}/services`, params),
  );
}

export function getServiceMetric(
  serviceId: number,
): Promise<ApiFetchResult<ServiceQualityMetricRead>> {
  return apiFetch<ServiceQualityMetricRead>(`${BASE}/services/${serviceId}`);
}

// POST /services/{id}/override — sets the manual override; returns the updated
// metric row.
export function setServiceOverride(
  serviceId: number,
  payload: QualityOverrideSetPayload,
): Promise<ApiFetchResult<ServiceQualityMetricRead>> {
  return apiFetch<ServiceQualityMetricRead>(
    `${BASE}/services/${serviceId}/override`,
    {
      method: "POST",
      body: JSON.stringify(payload),
      redirectOn401: false,
    },
  );
}

// DELETE /services/{id}/override — clears the manual override (no body);
// returns the updated metric row.
export function clearServiceOverride(
  serviceId: number,
): Promise<ApiFetchResult<ServiceQualityMetricRead>> {
  return apiFetch<ServiceQualityMetricRead>(
    `${BASE}/services/${serviceId}/override`,
    { method: "DELETE", redirectOn401: false },
  );
}

// --------------------------------------------------------------------------- //
// Provider quality metrics — list + detail (read-only)                         //
// --------------------------------------------------------------------------- //

export function listProviderMetrics(
  query: ProviderQualityListQuery = {},
): Promise<ApiFetchResult<ProviderQualityListResponse>> {
  const params = new URLSearchParams();
  appendStr(params, "sort_by", query.sort_by);
  appendStr(params, "sort_dir", query.sort_dir);
  appendNum(params, "limit", query.limit);
  appendNum(params, "offset", query.offset);
  return apiFetch<ProviderQualityListResponse>(
    withQs(`${BASE}/providers`, params),
  );
}

export function getProviderMetric(
  providerId: number,
): Promise<ApiFetchResult<ProviderQualityMetricRead>> {
  return apiFetch<ProviderQualityMetricRead>(
    `${BASE}/providers/${providerId}`,
  );
}

// --------------------------------------------------------------------------- //
// Formula configs — list, detail, activate (POST /{id}/activate), rollback     //
// (POST /rollback, no body)                                                    //
// --------------------------------------------------------------------------- //

export function listFormulaConfigs(
  query: FormulaConfigListQuery = {},
): Promise<ApiFetchResult<FormulaConfigListResponse>> {
  const params = new URLSearchParams();
  appendNum(params, "limit", query.limit);
  appendNum(params, "offset", query.offset);
  return apiFetch<FormulaConfigListResponse>(
    withQs(`${BASE}/formula-configs`, params),
  );
}

export function getFormulaConfig(
  configId: number,
): Promise<ApiFetchResult<FormulaConfigRead>> {
  return apiFetch<FormulaConfigRead>(`${BASE}/formula-configs/${configId}`);
}

export function activateFormulaConfig(
  configId: number,
): Promise<ApiFetchResult<FormulaConfigRead>> {
  return apiFetch<FormulaConfigRead>(
    `${BASE}/formula-configs/${configId}/activate`,
    { method: "POST", redirectOn401: false },
  );
}

// POST /formula-configs/rollback — no body; restores the previous version and
// returns the now-active config.
export function rollbackFormulaConfig(): Promise<
  ApiFetchResult<FormulaConfigRead>
> {
  return apiFetch<FormulaConfigRead>(`${BASE}/formula-configs/rollback`, {
    method: "POST",
    redirectOn401: false,
  });
}

// --------------------------------------------------------------------------- //
// Anomaly events — list (resolved filter), detail, review (POST /{id}/review)  //
// --------------------------------------------------------------------------- //

export function listAnomalies(
  query: AnomalyListQuery = {},
): Promise<ApiFetchResult<AnomalyListResponse>> {
  const params = new URLSearchParams();
  appendNum(params, "service_id", query.service_id);
  appendNum(params, "provider_id", query.provider_id);
  appendStr(params, "severity", query.severity);
  appendStr(params, "event_type", query.event_type);
  appendBool(params, "resolved", query.resolved);
  appendNum(params, "limit", query.limit);
  appendNum(params, "offset", query.offset);
  return apiFetch<AnomalyListResponse>(withQs(`${BASE}/anomalies`, params));
}

export function getAnomaly(
  anomalyId: number,
): Promise<ApiFetchResult<AnomalyEventRead>> {
  return apiFetch<AnomalyEventRead>(`${BASE}/anomalies/${anomalyId}`);
}

// POST /anomalies/{id}/review — optional {note}; marks the row resolved and
// returns the updated event.
export function reviewAnomaly(
  anomalyId: number,
  payload: AnomalyReviewPayload = {},
): Promise<ApiFetchResult<AnomalyEventRead>> {
  return apiFetch<AnomalyEventRead>(`${BASE}/anomalies/${anomalyId}/review`, {
    method: "POST",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}
