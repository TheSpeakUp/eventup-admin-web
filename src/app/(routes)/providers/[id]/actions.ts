"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  blockProvider,
  deleteProvider,
  unblockProvider,
  verifyProvider,
} from "@/lib/providers/api";
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
