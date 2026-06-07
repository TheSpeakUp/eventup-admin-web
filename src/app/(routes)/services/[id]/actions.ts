"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  approveService,
  hideService,
  rejectService,
  requestChangesService,
  restoreService,
} from "@/lib/services/api";
import type { ActionState } from "./action-types";

const idSchema = z.string().min(1, "service id is required");
const reasonSchema = z.string().trim().min(10, "Reason must be at least 10 characters");

function revalidate(id: string) {
  revalidatePath(`/services/${id}`);
  revalidatePath("/services");
}

function failParse(err: z.ZodError): ActionState {
  return { ok: false, error: err.issues[0]?.message ?? "Invalid input" };
}

async function reasoned(
  formData: FormData,
  call: (id: string, reason: string) => Promise<{ ok: boolean; status: number; message?: string }>,
): Promise<ActionState> {
  const idParse = idSchema.safeParse(formData.get("serviceId"));
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
  const idParse = idSchema.safeParse(formData.get("serviceId"));
  if (!idParse.success) return failParse(idParse.error);
  const result = await call(idParse.data);
  if (!result.ok) {
    return { ok: false, error: result.message ?? `Request failed (${result.status})` };
  }
  revalidate(idParse.data);
  return { ok: true, error: null };
}

export async function approveServiceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return plain(formData, approveService);
}

export async function rejectServiceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return reasoned(formData, rejectService);
}

export async function requestChangesServiceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return reasoned(formData, requestChangesService);
}

export async function hideServiceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return plain(formData, hideService);
}

export async function restoreServiceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return plain(formData, restoreService);
}
