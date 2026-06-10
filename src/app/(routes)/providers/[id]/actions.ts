"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  blockProvider,
  deleteProvider,
  patchProviderFields,
  unblockProvider,
  verifyProvider,
} from "@/lib/providers/api";
import type { ProviderFieldsPatch } from "@/lib/providers/types";
import type { ActionState } from "./action-types";

const idSchema = z.coerce.number().int().positive("provider id is required");
const reasonSchema = z.string().trim().min(10, "Reason must be at least 10 characters");
const messageOptionalSchema = z.string().trim().min(1).max(2000).optional();

function revalidate(id: number) {
  revalidatePath(`/providers/${id}`);
  revalidatePath("/providers");
}

function fail(message: string): ActionState {
  return { ok: false, error: message };
}

function parseProviderId(formData: FormData): { ok: true; id: number } | { ok: false; state: ActionState } {
  const parsed = idSchema.safeParse(formData.get("providerId"));
  if (!parsed.success) return { ok: false, state: fail(parsed.error.issues[0]?.message ?? "Invalid id") };
  return { ok: true, id: parsed.data };
}

export async function verifyProviderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseProviderId(formData);
  if (!idR.ok) return idR.state;
  const messageRaw = formData.get("message");
  let message: string | undefined;
  if (typeof messageRaw === "string" && messageRaw.trim().length > 0) {
    const parsed = messageOptionalSchema.safeParse(messageRaw);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid message");
    message = parsed.data;
  }
  const result = await verifyProvider(idR.id, message);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function blockProviderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseProviderId(formData);
  if (!idR.ok) return idR.state;
  const reasonR = reasonSchema.safeParse(formData.get("reason"));
  if (!reasonR.success) return fail(reasonR.error.issues[0]?.message ?? "Invalid reason");
  const result = await blockProvider(idR.id, reasonR.data);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function unblockProviderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseProviderId(formData);
  if (!idR.ok) return idR.state;
  const result = await unblockProvider(idR.id);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function deleteProviderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseProviderId(formData);
  if (!idR.ok) return idR.state;
  const result = await deleteProvider(idR.id);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

// ── Field-edit (M7) ────────────────────────────────────────────────────────
//
// The form submits, per editable field `f`: the new value at key `f` and the
// original value at hidden key `__cur_f`. We diff new-vs-current here so the
// PATCH body carries ONLY changed fields. Three states per field:
//   • unchanged → omit from payload;
//   • set to a new value → include the value;
//   • cleared (nullable only) → include explicit `null`.
// Required (NON-nullable) fields can never be blank → validation error, never
// null. Currency is normalized to upper-case before the diff.

function rawStr(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Diff a NULLABLE string field: null = clear, omit = unchanged. */
function diffNullableString(
  patch: ProviderFieldsPatch,
  formData: FormData,
  key: "description" | "website" | "address" | "logo_url",
): void {
  const next = rawStr(formData, key);
  const cur = rawStr(formData, `__cur_${key}`);
  if (next === cur) return;
  patch[key] = next === "" ? null : next;
}

export async function editProviderFieldsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const idR = parseProviderId(formData);
  if (!idR.ok) return idR.state;

  const patch: ProviderFieldsPatch = {};

  // name — REQUIRED (non-nullable): blank is a validation error, never null.
  const name = rawStr(formData, "name");
  const curName = rawStr(formData, "__cur_name");
  if (name === "") return fail("Name is required");
  if (name !== curName) patch.name = name;

  // account_currency — REQUIRED (non-nullable), normalize to upper-case.
  const currency = rawStr(formData, "account_currency").toUpperCase();
  const curCurrency = rawStr(formData, "__cur_account_currency").toUpperCase();
  if (currency === "") return fail("Account currency is required");
  if (currency !== curCurrency) patch.account_currency = currency;

  // Nullable strings — empty input clears (null), unchanged omits.
  diffNullableString(patch, formData, "description");
  diffNullableString(patch, formData, "website");
  diffNullableString(patch, formData, "address");
  diffNullableString(patch, formData, "logo_url");

  // location_id — nullable integer. Empty → clear (null); non-int → error.
  const locRaw = rawStr(formData, "location_id");
  const curLocRaw = rawStr(formData, "__cur_location_id");
  if (locRaw !== curLocRaw) {
    if (locRaw === "") {
      patch.location_id = null;
    } else {
      const n = Number(locRaw);
      if (!Number.isInteger(n) || n <= 0)
        return fail("Location id must be a positive integer");
      patch.location_id = n;
    }
  }

  if (Object.keys(patch).length === 0) {
    // Nothing changed — treat as a no-op success so the form just closes.
    return { ok: true, error: null };
  }

  const result = await patchProviderFields(idR.id, patch);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}
