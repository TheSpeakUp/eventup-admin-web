"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { forceOfferDispatch, forceProviderDispatch, replayDlq } from "@/lib/offers/api";
import type { DlqReplayMode } from "@/lib/offers/types";
import type { OpsActionState } from "./action-types";

function fail(message: string): OpsActionState {
  return { ok: false, error: message, message: null };
}

function stepUpHalt(stepUp: { permission?: string }): OpsActionState {
  return { ok: false, error: "", message: null, stepUp };
}

export async function forceOfferDispatchAction(_prev: OpsActionState, _fd: FormData): Promise<OpsActionState> {
  const key = randomUUID();
  const result = await forceOfferDispatch(key);
  if (!result.ok) {
    if (result.stepUp) return stepUpHalt(result.stepUp);
    return fail(result.message ?? `Request failed (${result.status})`);
  }
  revalidatePath("/offers/ops");
  return {
    ok: true,
    error: null,
    message: `Checked ${result.data.checked_offers} offers · reminded ${result.data.reminders_sent} · auto-closed ${result.data.auto_closed} · escalated ${result.data.escalations_sent}`,
  };
}

export async function forceProviderDispatchAction(_prev: OpsActionState, _fd: FormData): Promise<OpsActionState> {
  const key = randomUUID();
  const result = await forceProviderDispatch(key);
  if (!result.ok) {
    if (result.stepUp) return stepUpHalt(result.stepUp);
    return fail(result.message ?? `Request failed (${result.status})`);
  }
  revalidatePath("/offers/ops");
  return {
    ok: true,
    error: null,
    message: `Checked ${result.data.checked_providers} providers · escalated ${result.data.escalations_sent}`,
  };
}

export async function replayDlqAction(_prev: OpsActionState, formData: FormData): Promise<OpsActionState> {
  const raw = formData.get("mode");
  const mode: DlqReplayMode = raw === "apply" ? "apply" : "dry_run";
  const result = await replayDlq({ mode });
  if (!result.ok) {
    if (result.stepUp) return stepUpHalt(result.stepUp);
    return fail(result.message ?? `Request failed (${result.status})`);
  }
  revalidatePath("/offers/ops");
  return {
    ok: true,
    error: null,
    message: `${mode}: ${result.data.processed_items}/${result.data.total_candidates} processed · sent ${result.data.sent_replays} · failed ${result.data.failed_replays}`,
  };
}
