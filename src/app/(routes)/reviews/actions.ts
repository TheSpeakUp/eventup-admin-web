// src/app/(routes)/reviews/actions.ts
"use server";
//
// Server Actions for the reviews moderation surface. All actions gate
// SUPERADMIN-only. Defense-in-depth: the UI only renders controls for
// SUPERADMIN, but each action also re-checks the session role here and the
// backend (mock) 403s a non-SUPERADMIN regardless. Backend errors surface
// via the meta.original_detail-first idiom in lib/api.

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth/session";
import {
  moderateReview,
  moderateReply,
} from "@/lib/reviews/api";
import type { ReviewModeratePayload, ReplyModeratePayload } from "@/lib/reviews/types";
import type { ActionState } from "./action-types";

function fail(message: string): ActionState {
  return { ok: false, error: message };
}
function ok(): ActionState {
  return { ok: true, error: null };
}

function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function idField(fd: FormData, key = "id"): number | null {
  const n = Number(fd.get(key));
  return Number.isInteger(n) && n >= 1 ? n : null;
}

// Server-side SUPERADMIN gate. Returns an error message string when the
// operator is not a SUPERADMIN, else null. Defense-in-depth alongside the
// backend 403 and the hidden UI controls.
async function requireSuperadmin(): Promise<string | null> {
  const session = await getAdminSession();
  if (session?.role !== "SUPERADMIN")
    return "This action requires the review-moderation permission.";
  return null;
}

// --------------------------------------------------------------------------- //
// Reviews — moderate (hide / remove / restore)                               //
// --------------------------------------------------------------------------- //

export async function moderateReviewAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const denied = await requireSuperadmin();
  if (denied) return fail(denied);
  const id = idField(fd, "review_id");
  if (id === null) return fail("Invalid review id");

  const action = str(fd, "action");
  if (!action || !["hide", "remove", "restore"].includes(action))
    return fail("Action must be hide, remove, or restore");

  const reason = str(fd, "reason");

  const payload: ReviewModeratePayload = {
    action: action as "hide" | "remove" | "restore",
  };
  if (reason !== undefined) payload.reason = reason;

  const res = await moderateReview(id, payload);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/reviews");
  return ok();
}

// --------------------------------------------------------------------------- //
// Replies — moderate (hide / restore)                                        //
// --------------------------------------------------------------------------- //

export async function moderateReplyAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const denied = await requireSuperadmin();
  if (denied) return fail(denied);
  const id = idField(fd, "review_id");
  if (id === null) return fail("Invalid review id");

  const action = str(fd, "action");
  if (!action || !["hide", "restore"].includes(action))
    return fail("Action must be hide or restore");

  const payload: ReplyModeratePayload = {
    action: action as "hide" | "restore",
  };

  const res = await moderateReply(id, payload);
  if (!res.ok) return fail(res.message ?? `Request failed (${res.status})`);
  revalidatePath("/reviews");
  return ok();
}
