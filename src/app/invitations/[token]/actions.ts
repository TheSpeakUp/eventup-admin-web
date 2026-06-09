"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { acceptInvitation } from "@/lib/admins/api";

export type AcceptState = { error: string | null };

const schema = z.object({
  token: z.string().min(1, "Invalid invitation link"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(256, "Password is too long"),
  confirm: z.string(),
});

export async function acceptInvitationAction(
  _prev: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (parsed.data.password !== parsed.data.confirm) {
    return { error: "Passwords do not match" };
  }
  const result = await acceptInvitation(parsed.data.token, parsed.data.password);
  if (!result.ok) {
    return { error: result.message };
  }
  // Account is now active — send them to login to sign in with the new password.
  redirect("/login?next=/admins");
}
