"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  approveService,
  archiveService,
  patchServiceFields,
  rejectService,
  republishService,
  unpublishService,
} from "@/lib/services/api";
import type { ServiceFieldsPatch } from "@/lib/services/types";
import type { ActionState } from "./action-types";

const idSchema = z.coerce.number().int().positive("service id is required");
const reasonSchema = z.string().trim().min(10, "Reason must be at least 10 characters");
const reasonOptionalSchema = z.string().trim().min(10, "Reason must be at least 10 characters").optional();

function revalidate(id: number) {
  revalidatePath(`/services/${id}`);
  revalidatePath("/services");
}

function fail(message: string): ActionState {
  return { ok: false, error: message };
}

function parseServiceId(formData: FormData): { ok: true; id: number } | { ok: false; state: ActionState } {
  const parsed = idSchema.safeParse(formData.get("serviceId"));
  if (!parsed.success) return { ok: false, state: fail(parsed.error.issues[0]?.message ?? "Invalid id") };
  return { ok: true, id: parsed.data };
}

function parseOptionalReason(value: FormDataEntryValue | null): { ok: true; reason: string | undefined } | { ok: false; state: ActionState } {
  if (value == null || value === "") return { ok: true, reason: undefined };
  const parsed = reasonOptionalSchema.safeParse(value);
  if (!parsed.success) return { ok: false, state: fail(parsed.error.issues[0]?.message ?? "Invalid reason") };
  return { ok: true, reason: parsed.data };
}

export async function approveServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseServiceId(formData);
  if (!idR.ok) return idR.state;
  const result = await approveService(idR.id);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function rejectServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseServiceId(formData);
  if (!idR.ok) return idR.state;
  const reasonR = reasonSchema.safeParse(formData.get("reason"));
  if (!reasonR.success) return fail(reasonR.error.issues[0]?.message ?? "Invalid reason");
  const commentRaw = formData.get("comment");
  const comment = typeof commentRaw === "string" && commentRaw.trim().length > 0 ? commentRaw.trim() : undefined;
  const result = await rejectService(idR.id, reasonR.data, comment);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function unpublishServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseServiceId(formData);
  if (!idR.ok) return idR.state;
  const reasonR = parseOptionalReason(formData.get("reason"));
  if (!reasonR.ok) return reasonR.state;
  const result = await unpublishService(idR.id, reasonR.reason);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function republishServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseServiceId(formData);
  if (!idR.ok) return idR.state;
  const result = await republishService(idR.id);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function archiveServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseServiceId(formData);
  if (!idR.ok) return idR.state;
  const reasonR = parseOptionalReason(formData.get("reason"));
  if (!reasonR.ok) return reasonR.state;
  const result = await archiveService(idR.id, reasonR.reason);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

// ── Field-edit (M7) ────────────────────────────────────────────────────────
//
// Diff new-vs-current server-side so the PATCH body carries ONLY changed
// fields. Three states per field: unchanged (omit), set (include value),
// cleared (nullable only → explicit null). Required (NON-nullable) fields can
// never be blank → validation error, never null.

function svcRawStr(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Diff a NULLABLE string field: null = clear, omit = unchanged. */
function diffNullableSvcString(
  patch: ServiceFieldsPatch,
  formData: FormData,
  key:
    | "description"
    | "currency"
    | "external_url"
    | "address"
    | "publication_discount_promo_code",
): void {
  const next = svcRawStr(formData, key);
  const cur = svcRawStr(formData, `__cur_${key}`);
  if (next === cur) return;
  patch[key] = next === "" ? null : next;
}

/**
 * Diff a NULLABLE integer field: empty = clear (null), unchanged = omit, else
 * the parsed int. Returns an error message string on a malformed value.
 */
function diffNullableSvcInt(
  patch: ServiceFieldsPatch,
  formData: FormData,
  key:
    | "category_id"
    | "base_price_minor"
    | "pricing_interval_minutes"
    | "max_units_per_order"
    | "publication_discount_percent",
  min: number,
  label: string,
): string | null {
  const next = svcRawStr(formData, key);
  const cur = svcRawStr(formData, `__cur_${key}`);
  if (next === cur) return null;
  if (next === "") {
    patch[key] = null;
    return null;
  }
  const n = Number(next);
  if (!Number.isInteger(n) || n < min)
    return `${label} must be an integer ≥ ${min}`;
  patch[key] = n;
  return null;
}

export async function editServiceFieldsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const idR = parseServiceId(formData);
  if (!idR.ok) return idR.state;

  const patch: ServiceFieldsPatch = {};

  // title — REQUIRED (non-nullable): blank is a validation error, never null.
  const title = svcRawStr(formData, "title");
  const curTitle = svcRawStr(formData, "__cur_title");
  if (title === "") return fail("Title is required");
  if (title !== curTitle) patch.title = title;

  // pricing_type — REQUIRED (non-nullable).
  const pricingType = svcRawStr(formData, "pricing_type");
  const curPricingType = svcRawStr(formData, "__cur_pricing_type");
  if (pricingType === "") return fail("Pricing type is required");
  if (pricingType !== curPricingType) patch.pricing_type = pricingType;

  // recipient_type — REQUIRED enum (0=All, 1=Speaker, 2=Organizer).
  const recipient = svcRawStr(formData, "recipient_type");
  const curRecipient = svcRawStr(formData, "__cur_recipient_type");
  if (recipient !== curRecipient) {
    const n = Number(recipient);
    if (![0, 1, 2].includes(n)) return fail("Recipient type is invalid");
    patch.recipient_type = n;
  }

  // remote_available / publication_discount_enabled — REQUIRED booleans.
  // Unchecked checkboxes are absent from FormData → read presence.
  const remote = formData.get("remote_available") === "on";
  const curRemote = svcRawStr(formData, "__cur_remote_available") === "true";
  if (remote !== curRemote) patch.remote_available = remote;

  const discountEnabled =
    formData.get("publication_discount_enabled") === "on";
  const curDiscountEnabled =
    svcRawStr(formData, "__cur_publication_discount_enabled") === "true";
  if (discountEnabled !== curDiscountEnabled)
    patch.publication_discount_enabled = discountEnabled;

  // Nullable strings.
  diffNullableSvcString(patch, formData, "description");
  diffNullableSvcString(patch, formData, "currency");
  diffNullableSvcString(patch, formData, "external_url");
  diffNullableSvcString(patch, formData, "address");
  diffNullableSvcString(patch, formData, "publication_discount_promo_code");

  // Nullable integers.
  for (const [key, min, label] of [
    ["category_id", 1, "Category id"],
    ["base_price_minor", 0, "Base price (minor)"],
    ["pricing_interval_minutes", 1, "Pricing interval"],
    ["max_units_per_order", 1, "Max units per order"],
    ["publication_discount_percent", 0, "Discount percent"],
  ] as const) {
    const err = diffNullableSvcInt(patch, formData, key, min, label);
    if (err) return fail(err);
  }

  if (Object.keys(patch).length === 0) {
    return { ok: true, error: null };
  }

  const result = await patchServiceFields(idR.id, patch);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}
