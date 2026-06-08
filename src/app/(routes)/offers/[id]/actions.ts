"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  approveOffer,
  archiveOffer,
  disableOffer,
  enableOffer,
  rejectOffer,
} from "@/lib/offers/api";
import type { ActionState } from "./action-types";

const idSchema = z.coerce.number().int().positive("offer id is required");
const reasonSchema = z.string().trim().min(10, "Reason must be at least 10 characters");
const reasonOptionalSchema = z.string().trim().min(10, "Reason must be at least 10 characters").optional();

function revalidate(id: number) {
  revalidatePath(`/offers/${id}`);
  revalidatePath("/offers");
}

function fail(message: string): ActionState {
  return { ok: false, error: message };
}

function parseOfferId(formData: FormData): { ok: true; id: number } | { ok: false; state: ActionState } {
  const parsed = idSchema.safeParse(formData.get("offerId"));
  if (!parsed.success) return { ok: false, state: fail(parsed.error.issues[0]?.message ?? "Invalid id") };
  return { ok: true, id: parsed.data };
}

function parseOptionalReason(value: FormDataEntryValue | null): { ok: true; reason: string | undefined } | { ok: false; state: ActionState } {
  if (value == null || value === "") return { ok: true, reason: undefined };
  const parsed = reasonOptionalSchema.safeParse(value);
  if (!parsed.success) return { ok: false, state: fail(parsed.error.issues[0]?.message ?? "Invalid reason") };
  return { ok: true, reason: parsed.data };
}

export async function approveOfferAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseOfferId(formData);
  if (!idR.ok) return idR.state;
  const result = await approveOffer(idR.id);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function rejectOfferAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseOfferId(formData);
  if (!idR.ok) return idR.state;
  const reasonR = reasonSchema.safeParse(formData.get("reason"));
  if (!reasonR.success) return fail(reasonR.error.issues[0]?.message ?? "Invalid reason");
  const result = await rejectOffer(idR.id, reasonR.data);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function archiveOfferAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseOfferId(formData);
  if (!idR.ok) return idR.state;
  const reasonR = parseOptionalReason(formData.get("reason"));
  if (!reasonR.ok) return reasonR.state;
  const result = await archiveOffer(idR.id, reasonR.reason);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function disableOfferAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseOfferId(formData);
  if (!idR.ok) return idR.state;
  const reasonR = parseOptionalReason(formData.get("reason"));
  if (!reasonR.ok) return reasonR.state;
  const result = await disableOffer(idR.id, reasonR.reason);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function enableOfferAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseOfferId(formData);
  if (!idR.ok) return idR.state;
  const result = await enableOffer(idR.id);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}
