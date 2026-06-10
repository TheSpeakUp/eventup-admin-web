// src/mocks/quality-store.ts
//
// In-memory mock store for the M4 quality / ranking slice. Same Map-with-seed +
// reset pattern as promotions-store.ts. The server actions validate/coerce
// every field before the handler reaches here, so the *Write inputs are typed.
import type {
  AnomalyEventRead,
  AnomalyListResponse,
  FormulaConfigListResponse,
  FormulaConfigRead,
  ProviderQualityListResponse,
  ProviderQualityMetricRead,
  ServiceQualityListResponse,
  ServiceQualityMetricRead,
} from "@/lib/quality/types";
import {
  buildFixtureAnomalies,
  buildFixtureFormulaConfigs,
  buildFixtureProviderMetrics,
  buildFixtureServiceMetrics,
} from "./quality-fixtures";

const serviceMetrics = new Map<number, ServiceQualityMetricRead>();
const providerMetrics = new Map<number, ProviderQualityMetricRead>();
const formulaConfigs = new Map<number, FormulaConfigRead>();
const anomalies = new Map<number, AnomalyEventRead>();

// Tracks the id of the config that was active immediately before the current
// one — backs the rollback mutation.
let previousActiveConfigId: number | null = null;

function ensureSeed(): void {
  if (serviceMetrics.size > 0) return;
  for (const m of buildFixtureServiceMetrics())
    serviceMetrics.set(m.service_id, m);
  for (const m of buildFixtureProviderMetrics())
    providerMetrics.set(m.provider_id, m);
  for (const c of buildFixtureFormulaConfigs()) formulaConfigs.set(c.id, c);
  for (const a of buildFixtureAnomalies()) anomalies.set(a.id, a);
  // v2 (#1) was the active version before v3 (#2) — seed the rollback target.
  previousActiveConfigId = 1;
}

export function resetQualityStore(): void {
  serviceMetrics.clear();
  providerMetrics.clear();
  formulaConfigs.clear();
  anomalies.clear();
  previousActiveConfigId = null;
  ensureSeed();
}

function paginate<T>(rows: T[], limit?: number, offset?: number) {
  const lim = Math.min(Math.max(limit ?? 50, 1), 200);
  const off = Math.max(offset ?? 0, 0);
  return { items: rows.slice(off, off + lim), total: rows.length };
}

// ---- Service metrics ------------------------------------------------------- //

export function listServiceMetricsPage(opts: {
  quality_tier?: string;
  provider_id?: number;
  has_override?: boolean;
  limit?: number;
  offset?: number;
}): ServiceQualityListResponse {
  ensureSeed();
  let rows = Array.from(serviceMetrics.values());
  if (opts.quality_tier !== undefined)
    rows = rows.filter((r) => r.quality_tier === opts.quality_tier);
  if (opts.provider_id !== undefined)
    rows = rows.filter((r) => r.provider_id === opts.provider_id);
  if (opts.has_override !== undefined)
    rows = rows.filter(
      (r) => (r.manual_override_coefficient !== null) === opts.has_override,
    );
  rows.sort((a, b) => b.ranking_score - a.ranking_score);
  return paginate(rows, opts.limit, opts.offset);
}

export function getServiceMetricById(
  id: number,
): ServiceQualityMetricRead | null {
  ensureSeed();
  return serviceMetrics.get(id) ?? null;
}

export type OverrideWrite = {
  coefficient: number;
  reason: string;
  until?: string | null;
};

export function setServiceOverrideRecord(
  id: number,
  input: OverrideWrite,
): ServiceQualityMetricRead | null {
  ensureSeed();
  const current = serviceMetrics.get(id);
  if (!current) return null;
  const updated: ServiceQualityMetricRead = {
    ...current,
    manual_override_coefficient: input.coefficient,
    manual_override_reason: input.reason,
    manual_override_until: input.until ?? null,
    updated_at: new Date(1).toISOString(),
  };
  serviceMetrics.set(id, updated);
  return updated;
}

export function clearServiceOverrideRecord(
  id: number,
): ServiceQualityMetricRead | null {
  ensureSeed();
  const current = serviceMetrics.get(id);
  if (!current) return null;
  const updated: ServiceQualityMetricRead = {
    ...current,
    manual_override_coefficient: null,
    manual_override_reason: null,
    manual_override_until: null,
    updated_at: new Date(1).toISOString(),
  };
  serviceMetrics.set(id, updated);
  return updated;
}

// ---- Provider metrics ------------------------------------------------------ //

export function listProviderMetricsPage(opts: {
  limit?: number;
  offset?: number;
}): ProviderQualityListResponse {
  ensureSeed();
  const rows = Array.from(providerMetrics.values()).sort(
    (a, b) => b.trust_score - a.trust_score,
  );
  return paginate(rows, opts.limit, opts.offset);
}

export function getProviderMetricById(
  id: number,
): ProviderQualityMetricRead | null {
  ensureSeed();
  return providerMetrics.get(id) ?? null;
}

// ---- Formula configs ------------------------------------------------------- //

export function listFormulaConfigsPage(opts: {
  limit?: number;
  offset?: number;
}): FormulaConfigListResponse {
  ensureSeed();
  const rows = Array.from(formulaConfigs.values()).sort((a, b) => a.id - b.id);
  return paginate(rows, opts.limit, opts.offset);
}

export function getFormulaConfigById(id: number): FormulaConfigRead | null {
  ensureSeed();
  return formulaConfigs.get(id) ?? null;
}

export type ActivateConfigResult =
  | { kind: "ok"; config: FormulaConfigRead }
  | { kind: "not_found" }
  | { kind: "conflict"; reason: string };

// Mirrors the backend: activating the already-active config is a no-op
// conflict; otherwise the previously-active config is deactivated (and recorded
// as the rollback target) and the requested config becomes active.
export function activateFormulaConfigRecord(id: number): ActivateConfigResult {
  ensureSeed();
  const target = formulaConfigs.get(id);
  if (!target) return { kind: "not_found" };
  if (target.is_active)
    return {
      kind: "conflict",
      reason: `Formula config ${id} is already active`,
    };
  const now = new Date(1).toISOString();
  for (const [cid, cfg] of formulaConfigs) {
    if (cfg.is_active && cid !== id) {
      previousActiveConfigId = cid;
      formulaConfigs.set(cid, { ...cfg, is_active: false, updated_at: now });
    }
  }
  const activated: FormulaConfigRead = {
    ...target,
    is_active: true,
    activated_at: now,
    updated_at: now,
  };
  formulaConfigs.set(id, activated);
  return { kind: "ok", config: activated };
}

export type RollbackConfigResult =
  | { kind: "ok"; config: FormulaConfigRead }
  | { kind: "conflict"; reason: string };

// Restores the previously-active config. Deactivates the current active one and
// re-activates the recorded previous target.
export function rollbackFormulaConfigRecord(): RollbackConfigResult {
  ensureSeed();
  if (previousActiveConfigId === null)
    return { kind: "conflict", reason: "No previous formula version to roll back to" };
  const target = formulaConfigs.get(previousActiveConfigId);
  if (!target)
    return { kind: "conflict", reason: "Previous formula version no longer exists" };
  const now = new Date(2).toISOString();
  let newPrevious: number | null = null;
  for (const [cid, cfg] of formulaConfigs) {
    if (cfg.is_active && cid !== previousActiveConfigId) {
      newPrevious = cid;
      formulaConfigs.set(cid, { ...cfg, is_active: false, updated_at: now });
    }
  }
  const restored: FormulaConfigRead = {
    ...target,
    is_active: true,
    activated_at: now,
    updated_at: now,
  };
  formulaConfigs.set(previousActiveConfigId, restored);
  previousActiveConfigId = newPrevious;
  return { kind: "ok", config: restored };
}

// ---- Anomalies ------------------------------------------------------------- //

export function listAnomaliesPage(opts: {
  service_id?: number;
  provider_id?: number;
  severity?: string;
  event_type?: string;
  resolved?: boolean;
  limit?: number;
  offset?: number;
}): AnomalyListResponse {
  ensureSeed();
  let rows = Array.from(anomalies.values());
  if (opts.service_id !== undefined)
    rows = rows.filter((r) => r.service_id === opts.service_id);
  if (opts.provider_id !== undefined)
    rows = rows.filter((r) => r.provider_id === opts.provider_id);
  if (opts.severity !== undefined)
    rows = rows.filter((r) => r.severity === opts.severity);
  if (opts.event_type !== undefined)
    rows = rows.filter((r) => r.event_type === opts.event_type);
  if (opts.resolved !== undefined)
    rows = rows.filter((r) => (r.resolved_at !== null) === opts.resolved);
  rows.sort((a, b) => a.id - b.id);
  return paginate(rows, opts.limit, opts.offset);
}

export function getAnomalyById(id: number): AnomalyEventRead | null {
  ensureSeed();
  return anomalies.get(id) ?? null;
}

export type ReviewAnomalyResult =
  | { kind: "ok"; anomaly: AnomalyEventRead }
  | { kind: "not_found" }
  | { kind: "conflict"; reason: string };

// Mirrors the backend: reviewing an already-resolved anomaly is a conflict;
// otherwise resolved_at is stamped and the reviewer id recorded.
export function reviewAnomalyRecord(id: number): ReviewAnomalyResult {
  ensureSeed();
  const current = anomalies.get(id);
  if (!current) return { kind: "not_found" };
  if (current.resolved_at !== null)
    return {
      kind: "conflict",
      reason: `Anomaly ${id} has already been reviewed`,
    };
  const updated: AnomalyEventRead = {
    ...current,
    resolved_at: new Date(2).toISOString(),
    resolved_by_admin_id: 1,
  };
  anomalies.set(id, updated);
  return { kind: "ok", anomaly: updated };
}
