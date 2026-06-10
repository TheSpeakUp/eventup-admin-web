// src/app/(routes)/quality/actions.ts
"use server";
//
// Server Actions for the M4 quality / ranking write surface (manual override
// set/clear, formula activate/rollback, anomaly review). All gate
// ADMIN_MARKETPLACE_RANKING_MANAGE = SUPERADMIN-only. Defense-in-depth: the UI
// only renders the controls for SUPERADMIN, but each action also re-checks the
// session role here and the backend (mock) 403s a non-SUPERADMIN regardless.
// Backend errors surface via the meta.original_detail-first idiom in lib/api.
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth/session";
import {
  activateFormulaConfig,
  clearServiceOverride,
  reviewAnomaly,
  rollbackFormulaConfig,
  setServiceOverride,
} from "@/lib/quality/api";
import type { QualityOverrideSetPayload } from "@/lib/quality/types";
import type { ActionState } from "./action-types";

function fail(message: string): ActionState {
  return { ok: false, error: message };
}
function ok(): ActionState {
  return { ok: true, error: null };
}

function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function idField(fd: FormData, key = "id"): number | null {
  const n = Number(fd.get(key));
  return Number.isInteger(n) && n >= 1 ? n : null;
}

// Server-side SUPERADMIN gate. Returns an error message string when the
// operator is not a SUPERADMIN, else null. Defense-in-depth alongside the
// backend 403 and the hidden UI controls.
async function requireSuperadmin(): Promise<string | null> {
  const session = await getAdminSession();
  if (session?.role !== "SUPERADMIN")
    return "This action requires the marketplace ranking-manage permission.";
  return null;
}

// --------------------------------------------------------------------------- //
// Manual override — set / clear                                                //
// --------------------------------------------------------------------------- //

export async function setOverrideAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const denied = await requireSuperadmin();
  if (denied) return fail(denied);
  const id = idField(fd, "service_id");
  if (id === null) return fail("Invalid service id");

  const rawCoefficient = str(fd, "coefficient");
  if (rawCoefficient === undefined) return fail("Coefficient is required");
  const coefficient = Number(rawCoefficient);
  if (!Number.isFinite(coefficient) || coefficient <= 0 || coefficient > 10)
    return fail("Coefficient must be a number in (0, 10]");
  const reason = str(fd, "reason");
  if (!reason) return fail("Reason is required");

  const payload: QualityOverrideSetPayload = { coefficient, reason };
  const until = str(fd, "until");
  if (until !== undefined) payload.until = until;

  const res = await setServiceOverride(id, payload);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath(`/quality/services/${id}`);
  revalidatePath("/quality");
  return ok();
}

export async function clearOverrideAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const denied = await requireSuperadmin();
  if (denied) return fail(denied);
  const id = idField(fd, "service_id");
  if (id === null) return fail("Invalid service id");

  const res = await clearServiceOverride(id);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath(`/quality/services/${id}`);
  revalidatePath("/quality");
  return ok();
}

// --------------------------------------------------------------------------- //
// Formula configs — activate / rollback                                        //
// --------------------------------------------------------------------------- //

export async function activateFormulaConfigAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const denied = await requireSuperadmin();
  if (denied) return fail(denied);
  const id = idField(fd, "config_id");
  if (id === null) return fail("Invalid formula config id");

  const res = await activateFormulaConfig(id);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/quality");
  return ok();
}

export async function rollbackFormulaConfigAction(
  _prev: ActionState,
  _fd: FormData,
): Promise<ActionState> {
  const denied = await requireSuperadmin();
  if (denied) return fail(denied);

  const res = await rollbackFormulaConfig();
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/quality");
  return ok();
}

// --------------------------------------------------------------------------- //
// Anomalies — review                                                           //
// --------------------------------------------------------------------------- //

export async function reviewAnomalyAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const denied = await requireSuperadmin();
  if (denied) return fail(denied);
  const id = idField(fd, "anomaly_id");
  if (id === null) return fail("Invalid anomaly id");

  const note = str(fd, "note");
  const res = await reviewAnomaly(id, note ? { note } : {});
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/quality");
  return ok();
}
