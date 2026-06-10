// src/app/(routes)/attribute-definitions/[key]/translations/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { putAttributeDefinitionTranslations } from "@/lib/attribute-definitions/api";
import type { AttributeDefinitionTranslationsPayload } from "@/lib/attribute-definitions/types";
import type { ActionState } from "../../action-types";

function fail(message: string): ActionState {
  return { ok: false, error: message };
}

const fieldSchema = z.object({
  locale: z.string().trim().min(2).max(10),
  label: z.string().trim().min(1).max(200),
  description: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
});
const enumSchema = z.object({
  locale: z.string().trim().min(2).max(10),
  enum_value: z.string().trim().min(1).max(255),
  label: z.string().trim().min(1).max(200),
});

function parseJson(formData: FormData, key: string): unknown {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return [];
  return JSON.parse(raw); // caller wraps in try/catch
}

export async function saveTranslationsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const key = formData.get("attribute_key");
  if (typeof key !== "string" || key.trim() === "")
    return fail("Invalid attribute key");

  let fieldsRaw: unknown;
  let enumsRaw: unknown;
  try {
    fieldsRaw = parseJson(formData, "field_translations");
    enumsRaw = parseJson(formData, "enum_value_translations");
  } catch {
    return fail("Invalid translations data");
  }

  const fields = z.array(fieldSchema).safeParse(fieldsRaw);
  if (!fields.success) return fail("Invalid field translations");
  const enums = z.array(enumSchema).safeParse(enumsRaw);
  if (!enums.success) return fail("Invalid enum translations");

  // Client mirrors these, but enforce uniqueness server-side too.
  const fieldLocales = new Set<string>();
  for (const f of fields.data) {
    if (fieldLocales.has(f.locale))
      return fail(`Duplicate field locale: ${f.locale}`);
    fieldLocales.add(f.locale);
  }
  const enumPairs = new Set<string>();
  for (const e of enums.data) {
    const pair = `${e.locale}|${e.enum_value}`;
    if (enumPairs.has(pair))
      return fail(`Duplicate enum translation: ${e.locale}/${e.enum_value}`);
    enumPairs.add(pair);
  }

  const payload: AttributeDefinitionTranslationsPayload = {
    field_translations: fields.data,
    enum_value_translations: enums.data,
  };
  const result = await putAttributeDefinitionTranslations(key, payload);
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath(`/attribute-definitions/${encodeURIComponent(key)}/translations`);
  return { ok: true, error: null };
}
