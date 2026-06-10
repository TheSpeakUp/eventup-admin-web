// src/app/(routes)/categories/[id]/attributes/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteCategoryBinding,
  upsertCategoryBinding,
} from "@/lib/categories/api";
import type { CategoryAttributeBindingUpsertPayload } from "@/lib/categories/types";
import type { ActionState } from "./action-types";

function fail(message: string): ActionState {
  return { ok: false, error: message };
}

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

// Hidden "false" sentinel + checkbox "true": checked → ["false","true"],
// unchecked → ["false"]. Order-independent membership check.
function flag(formData: FormData, key: string): boolean {
  return formData.getAll(key).includes("true");
}

function ids(formData: FormData):
  | { ok: true; categoryId: number; attributeKey: string }
  | { ok: false; error: string } {
  const rawId = str(formData, "category_id");
  const categoryId = Number(rawId);
  if (!rawId || !Number.isInteger(categoryId) || categoryId < 1)
    return { ok: false, error: "Invalid category id" };
  const attributeKey = str(formData, "attribute_key");
  if (!attributeKey) return { ok: false, error: "Invalid attribute key" };
  return { ok: true, categoryId, attributeKey };
}

export async function upsertBindingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const target = ids(formData);
  if (!target.ok) return fail(target.error);

  // descriptor: JSON.parse only; required (PUT is a full upsert — backend
  // rejects a missing descriptor). Backend deep-validates the shape.
  const descRaw = formData.get("descriptor");
  const descStr = typeof descRaw === "string" ? descRaw.trim() : "";
  if (descStr === "") return fail("descriptor is required");
  let descriptor: Record<string, unknown> | string;
  try {
    descriptor = JSON.parse(descStr) as Record<string, unknown> | string;
  } catch {
    return fail("descriptor: invalid JSON");
  }

  const group = str(formData, "group_name");
  if (group !== undefined && group.length > 64)
    return fail("Group name must be at most 64 characters");

  const sortRaw = str(formData, "sort_order");
  if (sortRaw === undefined) return fail("Sort order is required");
  const sortOrder = Number(sortRaw);
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000)
    return fail("Sort order must be an integer 0–10000");

  // Full payload, always: omitted fields would silently reset to defaults.
  const payload: CategoryAttributeBindingUpsertPayload = {
    descriptor,
    group_name: group ?? null,
    sort_order: sortOrder,
    is_visible_in_filters: flag(formData, "is_visible_in_filters"),
    is_visible_in_card: flag(formData, "is_visible_in_card"),
  };

  const result = await upsertCategoryBinding(
    target.categoryId,
    target.attributeKey,
    payload,
  );
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath(`/categories/${target.categoryId}/attributes`);
  redirect(`/categories/${target.categoryId}/attributes`);
}

export async function deleteBindingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const target = ids(formData);
  if (!target.ok) return fail(target.error);
  const result = await deleteCategoryBinding(
    target.categoryId,
    target.attributeKey,
  );
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath(`/categories/${target.categoryId}/attributes`);
  redirect(`/categories/${target.categoryId}/attributes`);
}
