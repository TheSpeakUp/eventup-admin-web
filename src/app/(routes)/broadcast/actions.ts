"use server";

import { z } from "zod";
import { previewBroadcast, sendBroadcast } from "@/lib/broadcast/api";
import { BROADCAST_AUDIENCES, type BroadcastAudience } from "@/lib/broadcast/types";

const audienceSchema = z.enum(BROADCAST_AUDIENCES);
const sendSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(2000),
  audience: audienceSchema,
  action_url: z.string().trim().max(500).optional(),
});

export type BroadcastActionState =
  | { ok: true; recipients: number; broadcastId: string }
  | { ok: false; error: string | null };

export async function previewBroadcastAction(
  audience: string,
): Promise<{ providers: number; recipients: number } | { error: string }> {
  const parsed = audienceSchema.safeParse(audience);
  if (!parsed.success) return { error: "Unknown audience" };
  const res = await previewBroadcast(parsed.data as BroadcastAudience);
  if (!res.ok) return { error: res.message ?? `HTTP ${res.status}` };
  return { providers: res.data.providers, recipients: res.data.recipients };
}

export async function sendBroadcastAction(
  _prev: BroadcastActionState,
  formData: FormData,
): Promise<BroadcastActionState> {
  const parsed = sendSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    audience: formData.get("audience"),
    action_url: formData.get("action_url") || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid form",
    };
  }
  const res = await sendBroadcast(parsed.data);
  if (!res.ok) return { ok: false, error: res.message ?? `HTTP ${res.status}` };
  return {
    ok: true,
    recipients: res.data.recipients,
    broadcastId: res.data.broadcast_id,
  };
}
