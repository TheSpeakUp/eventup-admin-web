"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  grantReviewerScope,
  revokeReviewerScope,
  updateAdmin,
} from "@/lib/admins/api";
import { ADMIN_ROLES } from "@/lib/admins/types";
import type { ActionState } from "../action-types";

const idSchema = z.string().uuid("admin id is required");
const roleSchema = z.enum(ADMIN_ROLES);
const scopeSchema = z.string().trim().min(1, "permission key is required");

function fail(message: string): ActionState {
  return { ok: false, error: message };
}

function revalidate(id: string) {
  revalidatePath(`/admins/${id}`);
  revalidatePath("/admins");
}

function parseId(formData: FormData): { ok: true; id: string } | { ok: false; state: ActionState } {
  const parsed = idSchema.safeParse(formData.get("adminId"));
  if (!parsed.success) return { ok: false, state: fail(parsed.error.issues[0]?.message ?? "Invalid id") };
  return { ok: true, id: parsed.data };
}

export async function updateAdminAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const idR = parseId(formData);
  if (!idR.ok) return idR.state;

  const payload: { role?: (typeof ADMIN_ROLES)[number]; is_active?: boolean } = {};

  const roleRaw = formData.get("role");
  if (typeof roleRaw === "string" && roleRaw.length > 0) {
    const parsed = roleSchema.safeParse(roleRaw);
    if (!parsed.success) return fail("Invalid role");
    payload.role = parsed.data;
  }

  const activeRaw = formData.get("is_active");
  if (typeof activeRaw === "string" && activeRaw.length > 0) {
    payload.is_active = activeRaw === "true";
  }

  if (payload.role === undefined && payload.is_active === undefined) {
    return fail("Nothing to update");
  }

  // Self-guard, last-active-superadmin, and every other admin-domain rejection
  // are enforced backend-side. Its error envelope now carries the specific
  // reason in error.meta.original_detail (read first by readError in lib/api),
  // so the generic path below surfaces it verbatim — no client-side pre-emption.
  const result = await updateAdmin(idR.id, payload);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function grantScopeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const idR = parseId(formData);
  if (!idR.ok) return idR.state;
  const scopeR = scopeSchema.safeParse(formData.get("permissionKey"));
  if (!scopeR.success) return fail(scopeR.error.issues[0]?.message ?? "Invalid scope");
  const result = await grantReviewerScope(idR.id, scopeR.data);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function revokeScopeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const idR = parseId(formData);
  if (!idR.ok) return idR.state;
  const scopeR = scopeSchema.safeParse(formData.get("permissionKey"));
  if (!scopeR.success) return fail(scopeR.error.issues[0]?.message ?? "Invalid scope");
  const result = await revokeReviewerScope(idR.id, scopeR.data);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}
