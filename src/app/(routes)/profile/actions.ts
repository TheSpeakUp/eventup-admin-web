"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { changeSelfPassword, updateSelfProfile } from "@/lib/self/api";
import { NEW_PASSWORD_MIN_LENGTH } from "@/lib/self/types";
import type { FormState } from "./action-types";

function fail(message: string): FormState {
  return { ok: false, done: false, error: message };
}

function ok(): FormState {
  return { ok: true, done: true, error: null };
}

function fromResult(result: {
  ok: false;
  status: number;
  message: string;
  stepUp?: { permission?: string };
}): FormState {
  if (result.stepUp) return { ok: false, done: false, error: "", stepUp: result.stepUp };
  return fail(result.message ?? `Request failed (${result.status})`);
}

// Display name: an empty field clears it (PATCH with null). Backend trims and
// re-validates; its rejection (if any) surfaces verbatim via lib/api readError.
const displayNameSchema = z
  .string()
  .trim()
  .max(255, "Display name is too long.")
  .optional();

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = formData.get("display_name");
  const parsed = displayNameSchema.safeParse(
    typeof raw === "string" ? raw : undefined,
  );
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid display name");
  }
  const value = parsed.data;
  const display_name = value && value.length > 0 ? value : null;

  const result = await updateSelfProfile({ display_name });
  if (!result.ok) return fromResult(result);

  revalidatePath("/profile");
  // The sidebar account block (rendered in the routes layout) also reads /self.
  revalidatePath("/", "layout");
  return ok();
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const current = formData.get("current_password");
  const next = formData.get("new_password");
  const confirm = formData.get("confirm_password");

  if (typeof current !== "string" || current.length === 0) {
    return fail("Enter your current password.");
  }
  if (typeof next !== "string" || next.length === 0) {
    return fail("Enter a new password.");
  }
  // Mirror the backend's pre-logic length gate (min 12 → 422) client-side so a
  // too-short password is rejected without a round-trip; the server still
  // enforces it as the source of truth.
  if (next.length < NEW_PASSWORD_MIN_LENGTH) {
    return fail(
      `New password must be at least ${NEW_PASSWORD_MIN_LENGTH} characters.`,
    );
  }
  // Confirmation is mandatory and must match. The length gate above runs first,
  // so a too-short password reports that rather than a spurious mismatch.
  if (typeof confirm !== "string" || confirm !== next) {
    return fail("New password and confirmation do not match.");
  }

  const result = await changeSelfPassword({
    current_password: current,
    new_password: next,
  });
  if (!result.ok) {
    // 422 (length, if it slips past the client guard) and 400 (wrong/same
    // current) both arrive here; surface the backend message verbatim.
    return fromResult(result);
  }
  return ok();
}
