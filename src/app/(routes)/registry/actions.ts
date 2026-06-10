"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  rollbackRegistrySnapshot,
  runRevalidation,
} from "@/lib/registry/api";
import type { RevalidationRunPayload } from "@/lib/registry/types";
import type { RevalidationState, RollbackState } from "./action-types";

// Parse a comma/space-separated list of positive integers. Empty → undefined
// (omit the filter). A non-integer token → error string.
function parseIdList(
  raw: FormDataEntryValue | null,
): { ok: true; ids: number[] | undefined } | { ok: false; error: string } {
  if (typeof raw !== "string" || raw.trim() === "")
    return { ok: true, ids: undefined };
  const tokens = raw.split(/[\s,]+/).filter((t) => t !== "");
  const ids: number[] = [];
  for (const t of tokens) {
    const n = Number(t);
    if (!Number.isInteger(n) || n < 1)
      return { ok: false, error: `Invalid id: "${t}" (positive integers only)` };
    ids.push(n);
  }
  return { ok: true, ids };
}

export async function rollbackSnapshotAction(
  _prev: RollbackState,
  formData: FormData,
): Promise<RollbackState> {
  const raw = formData.get("snapshot_id");
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1)
    return { ok: false, error: "Invalid snapshot id" };
  const result = await rollbackRegistrySnapshot(id);
  if (!result.ok)
    return {
      ok: false,
      error: result.message ?? `Request failed (${result.status})`,
    };
  revalidatePath("/registry");
  redirect("/registry");
}

export async function runRevalidationAction(
  _prev: RevalidationState,
  formData: FormData,
): Promise<RevalidationState> {
  const categories = parseIdList(formData.get("category_ids"));
  if (!categories.ok) return { ok: false, error: categories.error };
  const services = parseIdList(formData.get("service_ids"));
  if (!services.ok) return { ok: false, error: services.error };

  const limitRaw = formData.get("limit");
  const limit = Number(limitRaw);
  if (!Number.isInteger(limit) || limit < 1 || limit > 5000)
    return { ok: false, error: "Limit must be an integer 1–5000" };

  const sourceRaw = formData.get("source");
  const source =
    typeof sourceRaw === "string" && sourceRaw.trim() !== ""
      ? sourceRaw.trim()
      : "admin_manual";
  if (source.length > 64)
    return { ok: false, error: "Source must be at most 64 characters" };

  // Hidden "true"/"false" sentinel + checkbox "true" (F9 bool pattern).
  const onlyPending = formData.getAll("only_pending").includes("true");

  const payload: RevalidationRunPayload = {
    category_ids: categories.ids,
    service_ids: services.ids,
    only_pending: onlyPending,
    limit,
    source,
  };
  const result = await runRevalidation(payload);
  if (!result.ok)
    return {
      ok: false,
      error: result.message ?? `Request failed (${result.status})`,
    };
  return { ok: true, result: result.data };
}
