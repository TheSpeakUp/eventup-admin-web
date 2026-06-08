"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  approveService,
  archiveService,
  rejectService,
  republishService,
  unpublishService,
} from "@/lib/services/api";
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
