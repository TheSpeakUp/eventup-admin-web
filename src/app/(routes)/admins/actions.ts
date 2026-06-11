"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createInvitation, revokeInvitation } from "@/lib/admins/api";
import { ADMIN_ROLES } from "@/lib/admins/types";
import type { ActionState, InviteState } from "./action-types";

const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(ADMIN_ROLES),
});

const idSchema = z.string().uuid("invitation id is required");

function fail(message: string): ActionState {
  return { ok: false, error: message };
}

export async function inviteAdminAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", email: null };
  }
  const result = await createInvitation(parsed.data.email, parsed.data.role);
  if (!result.ok) {
    if (result.stepUp) {
      return { ok: false, error: "", email: null, stepUp: result.stepUp };
    }
    return { ok: false, error: result.message ?? `Request failed (${result.status})`, email: null };
  }
  revalidatePath("/admins");
  return { ok: true, error: null, email: parsed.data.email };
}

export async function revokeInvitationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = idSchema.safeParse(formData.get("invitationId"));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid id");
  const result = await revokeInvitation(parsed.data);
  if (!result.ok) {
    if (result.stepUp) {
      return { ok: false, error: "", stepUp: result.stepUp };
    }
    return fail(result.message ?? `Request failed (${result.status})`);
  }
  revalidatePath("/admins");
  return { ok: true, error: null };
}
