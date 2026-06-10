// src/app/(routes)/attribute-definitions/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAttributeDefinition,
  deleteAttributeDefinition,
  updateAttributeDefinition,
} from "@/lib/attribute-definitions/api";
import type { AttributeDefinitionMutationPayload } from "@/lib/attribute-definitions/types";
import type { ActionState } from "./action-types";

function fail(message: string): ActionState {
  return { ok: false, error: message };
}

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

// A hidden checkbox carries "true"/"false"; absence → undefined (leave unchanged).
// Use getAll to check if the "true" value is present (checkbox checked).
function bool(formData: FormData, key: string): boolean | undefined {
  const values = formData.getAll(key);
  if (values.length === 0) return undefined;
  return values.includes("true");
}

// Build the payload. `requireKey`/`requireDescriptor` = true for create.
function buildPayload(
  formData: FormData,
  requireKey: boolean,
):
  | { ok: true; payload: AttributeDefinitionMutationPayload }
  | { ok: false; error: string } {
  const payload: AttributeDefinitionMutationPayload = {};

  if (requireKey) {
    const key = str(formData, "key");
    if (!key) return { ok: false, error: "Key is required" };
    if (key.length > 100)
      return { ok: false, error: "Key must be at most 100 characters" };
    payload.key = key;
  }

  // descriptor: JSON.parse only; accept any valid JSON (object or string).
  // Required on create. Backend deep-validates the shape.
  const descRaw = formData.get("descriptor");
  const descStr = typeof descRaw === "string" ? descRaw.trim() : "";
  if (descStr === "") {
    if (requireKey) return { ok: false, error: "descriptor is required" };
  } else {
    try {
      payload.descriptor = JSON.parse(descStr);
    } catch {
      return { ok: false, error: "descriptor: invalid JSON" };
    }
  }

  const group = str(formData, "group_name");
  if (group !== undefined) {
    if (group.length > 64)
      return { ok: false, error: "Group name must be at most 64 characters" };
    payload.group_name = group;
  }

  const sortRaw = str(formData, "sort_order");
  if (sortRaw !== undefined) {
    const n = Number(sortRaw);
    if (!Number.isInteger(n) || n < 0 || n > 10000)
      return { ok: false, error: "Sort order must be an integer 0–10000" };
    payload.sort_order = n;
  }

  const isActive = bool(formData, "is_active");
  if (isActive !== undefined) payload.is_active = isActive;
  const isSystem = bool(formData, "is_system");
  if (isSystem !== undefined) payload.is_system = isSystem;

  return { ok: true, payload };
}

export async function createAttributeDefinitionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const built = buildPayload(formData, true);
  if (!built.ok) return fail(built.error);
  const result = await createAttributeDefinition(built.payload);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath("/attribute-definitions");
  redirect(`/attribute-definitions/${encodeURIComponent(result.data.key)}`);
}

export async function updateAttributeDefinitionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const key = str(formData, "key");
  if (!key) return fail("Invalid attribute key");
  const built = buildPayload(formData, false);
  if (!built.ok) return fail(built.error);
  if (Object.keys(built.payload).length === 0) return fail("Nothing to update");
  const result = await updateAttributeDefinition(key, built.payload);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath(`/attribute-definitions/${encodeURIComponent(key)}`);
  revalidatePath("/attribute-definitions");
  return { ok: true, error: null };
}

export async function deleteAttributeDefinitionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const key = str(formData, "key");
  if (!key) return fail("Invalid attribute key");
  const result = await deleteAttributeDefinition(key);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath("/attribute-definitions");
  redirect("/attribute-definitions");
}
