"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  approveProvider,
  rejectProvider,
  restoreProvider,
  suspendProvider,
} from "@/lib/providers/api";
import type { ActionState } from "./action-types";

const idSchema = z.string().min(1, "provider id is required");
const reasonSchema = z.string().trim().min(10, "Reason must be at least 10 characters");

function revalidate(id: string) {
  revalidatePath(`/providers/${id}`);
  revalidatePath("/providers");
}

function failParse(err: z.ZodError): ActionState {
  return { ok: false, error: err.issues[0]?.message ?? "Invalid input" };
}

async function reasoned(
  formData: FormData,
  call: (id: string, reason: string) => Promise<{ ok: boolean; status: number; message?: string }>,
): Promise<ActionState> {
  const idParse = idSchema.safeParse(formData.get("providerId"));
  if (!idParse.success) return failParse(idParse.error);
  const reasonParse = reasonSchema.safeParse(formData.get("reason"));
  if (!reasonParse.success) return failParse(reasonParse.error);
  const result = await call(idParse.data, reasonParse.data);
  if (!result.ok) {
    return { ok: false, error: result.message ?? `Request failed (${result.status})` };
  }
  revalidate(idParse.data);
  return { ok: true, error: null };
}

async function plain(
  formData: FormData,
  call: (id: string) => Promise<{ ok: boolean; status: number; message?: string }>,
): Promise<ActionState> {
  const idParse = idSchema.safeParse(formData.get("providerId"));
  if (!idParse.success) return failParse(idParse.error);
  const result = await call(idParse.data);
  if (!result.ok) {
    return { ok: false, error: result.message ?? `Request failed (${result.status})` };
  }
  revalidate(idParse.data);
  return { ok: true, error: null };
}

export async function approveProviderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return plain(formData, approveProvider);
}

export async function rejectProviderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return reasoned(formData, rejectProvider);
}

export async function suspendProviderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return reasoned(formData, suspendProvider);
}

export async function restoreProviderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return plain(formData, restoreProvider);
}
