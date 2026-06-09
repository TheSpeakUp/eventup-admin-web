// src/app/(routes)/categories/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/categories/api";
import { ATTRIBUTE_TYPES } from "@/lib/categories/types";
import type {
  AttributeSchema,
  CategoryMutationPayload,
} from "@/lib/categories/types";
import type { ActionState } from "./action-types";

function fail(message: string): ActionState {
  return { ok: false, error: message };
}

const descriptorSchema = z.object({
  type: z.enum(ATTRIBUTE_TYPES).optional(),
  required: z.boolean().optional(),
  searchable: z.boolean().optional(),
  enum: z
    .array(z.union([z.string(), z.number(), z.boolean()]))
    .min(1, "enum must be a non-empty list")
    .optional(),
});
const attributeSchemaSchema = z.record(z.string(), descriptorSchema);
const translationsSchema = z.record(z.string(), z.string());

// Parse a hidden JSON field; "" / missing → undefined. Throws a friendly
// message on malformed JSON.
function parseJsonField(formData: FormData, key: string): unknown {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${key}: invalid JSON`);
  }
}

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

// Build the mutation payload from FormData. `requireCore` = true for create
// (name/slug mandatory); false for edit (partial).
function buildPayload(
  formData: FormData,
  requireCore: boolean,
):
  | { ok: true; payload: CategoryMutationPayload }
  | { ok: false; error: string } {
  const payload: CategoryMutationPayload = {};

  const name = str(formData, "name");
  const slug = str(formData, "slug");
  if (requireCore && (!name || !slug)) {
    return { ok: false, error: "Name and slug are required" };
  }
  if (name !== undefined) payload.name = name;
  if (slug !== undefined) payload.slug = slug;

  const icon = str(formData, "icon");
  if (icon !== undefined) payload.icon = icon;
  const description = str(formData, "description");
  if (description !== undefined) payload.description = description;

  const sortRaw = str(formData, "sort_order");
  if (sortRaw !== undefined) {
    const n = Number(sortRaw);
    if (!Number.isInteger(n) || n < 0 || n > 10000)
      return { ok: false, error: "Sort order must be an integer 0–10000" };
    payload.sort_order = n;
  }

  const parentRaw = str(formData, "parent_id");
  if (parentRaw !== undefined) {
    const n = Number(parentRaw);
    if (!Number.isInteger(n) || n < 1)
      return { ok: false, error: "Invalid parent category" };
    payload.parent_id = n;
  }

  // Prices (sent as strings).
  const currency = str(formData, "publication_currency");
  const monthly = str(formData, "publication_price_monthly");
  const discounted = str(formData, "publication_price_monthly_discounted");
  if (monthly !== undefined) {
    const m = Number(monthly);
    if (!Number.isFinite(m) || m < 0)
      return { ok: false, error: "Monthly price must be ≥ 0" };
    if (currency === undefined)
      return {
        ok: false,
        error: "Currency is required when a monthly price is set",
      };
    payload.publication_price_monthly = monthly;
  }
  if (currency !== undefined) payload.publication_currency = currency;
  if (discounted !== undefined) {
    const d = Number(discounted);
    if (!Number.isFinite(d) || d < 0)
      return { ok: false, error: "Discounted price must be ≥ 0" };
    if (payload.publication_price_monthly === undefined)
      return {
        ok: false,
        error: "Monthly price is required when a discounted price is set",
      };
    if (d > Number(payload.publication_price_monthly))
      return {
        ok: false,
        error: "Discounted price cannot exceed the monthly price",
      };
    payload.publication_price_monthly_discounted = discounted;
  }

  // JSON fields.
  try {
    const nameTr = parseJsonField(formData, "name_translations");
    if (nameTr !== undefined) {
      const p = translationsSchema.safeParse(nameTr);
      if (!p.success) return { ok: false, error: "Invalid name translations" };
      if (Object.keys(p.data).length > 0) payload.name_translations = p.data;
    }
    const descTr = parseJsonField(formData, "description_translations");
    if (descTr !== undefined) {
      const p = translationsSchema.safeParse(descTr);
      if (!p.success)
        return { ok: false, error: "Invalid description translations" };
      if (Object.keys(p.data).length > 0)
        payload.description_translations = p.data;
    }
    const attr = parseJsonField(formData, "attribute_schema");
    if (attr !== undefined) {
      const p = attributeSchemaSchema.safeParse(attr);
      if (!p.success)
        return {
          ok: false,
          error: p.error.issues[0]?.message ?? "Invalid attribute schema",
        };
      payload.attribute_schema = p.data as AttributeSchema;
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }

  return { ok: true, payload };
}

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const built = buildPayload(formData, true);
  if (!built.ok) return fail(built.error);
  const result = await createCategory(built.payload);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath("/categories");
  redirect(`/categories/${result.data.id}`);
}

export async function updateCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const idRaw = formData.get("id");
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id < 1) return fail("Invalid category id");
  const built = buildPayload(formData, false);
  if (!built.ok) return fail(built.error);
  if (Object.keys(built.payload).length === 0) return fail("Nothing to update");
  const result = await updateCategory(id, built.payload);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath(`/categories/${id}`);
  revalidatePath("/categories");
  return { ok: true, error: null };
}

export async function deleteCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) return fail("Invalid category id");
  const result = await deleteCategory(id);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath("/categories");
  redirect("/categories");
}
