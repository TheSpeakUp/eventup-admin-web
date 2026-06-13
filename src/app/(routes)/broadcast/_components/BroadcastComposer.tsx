"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { BROADCAST_AUDIENCES, type BroadcastAudience } from "@/lib/broadcast/types";
import {
  previewBroadcastAction,
  sendBroadcastAction,
  type BroadcastActionState,
} from "../actions";

const EMPTY: BroadcastActionState = { ok: false, error: null };

const AUDIENCE_LABELS: Record<BroadcastAudience, string> = {
  all: "All providers (except cancelled)",
  verified: "Verified providers",
  pending: "Pending providers",
  blocked: "Blocked providers",
};

export default function BroadcastComposer() {
  const [audience, setAudience] = useState<BroadcastAudience>("all");
  const [preview, setPreview] = useState<{
    providers: number;
    recipients: number;
  } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pendingPreview, startPreview] = useTransition();
  const [state, formAction, sending] = useActionState(sendBroadcastAction, EMPTY);

  useEffect(() => {
    startPreview(async () => {
      const res = await previewBroadcastAction(audience);
      if ("error" in res) {
        setPreviewError(res.error);
        setPreview(null);
      } else {
        setPreviewError(null);
        setPreview(res);
      }
    });
  }, [audience]);

  if (state.ok) {
    return (
      <div
        data-testid="broadcast-sent"
        className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-6 text-sm text-emerald-300"
      >
        Announcement queued for {state.recipients} recipient
        {state.recipients === 1 ? "" : "s"} (broadcast{" "}
        <span className="font-mono text-xs">{state.broadcastId}</span>). Delivery
        runs through the notification outbox within seconds.
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="max-w-2xl space-y-4 rounded-md border border-zinc-200 bg-surface-1 p-6"
      data-testid="broadcast-form"
    >
      <label className="block text-sm">
        <span className="text-zinc-600">Audience</span>
        <select
          name="audience"
          value={audience}
          onChange={(e) => {
            setAudience(e.target.value as BroadcastAudience);
            setConfirming(false);
          }}
          data-testid="broadcast-audience"
          className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-sm focus:border-zinc-500 focus:outline-none"
        >
          {BROADCAST_AUDIENCES.map((a) => (
            <option key={a} value={a}>
              {AUDIENCE_LABELS[a]}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-zinc-500" data-testid="broadcast-preview">
        {pendingPreview
          ? "Counting recipients…"
          : previewError
            ? `Preview failed: ${previewError}`
            : preview
              ? `${preview.recipients} recipient${preview.recipients === 1 ? "" : "s"} across ${preview.providers} provider${preview.providers === 1 ? "" : "s"}`
              : "—"}
      </p>
      <label className="block text-sm">
        <span className="text-zinc-600">Title</span>
        <input
          name="title"
          required
          maxLength={200}
          data-testid="broadcast-title"
          className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="text-zinc-600">Message</span>
        <textarea
          name="body"
          required
          maxLength={2000}
          rows={5}
          data-testid="broadcast-body"
          className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="text-zinc-600">Action link (optional)</span>
        <input
          name="action_url"
          maxLength={500}
          placeholder="/news/maintenance or https://…"
          data-testid="broadcast-action-url"
          className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-300" data-testid="broadcast-error">
          {state.error}
        </p>
      ) : null}
      <div className="flex items-center justify-end gap-3">
        {confirming ? (
          <>
            <span className="text-sm text-zinc-600" data-testid="broadcast-confirm-copy">
              Send to {preview?.recipients ?? "?"} recipients — cannot be
              recalled.
            </span>
            <button
              type="submit"
              disabled={sending}
              data-testid="broadcast-send"
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:bg-zinc-400"
            >
              {sending ? "Sending…" : "Send broadcast"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-sm text-zinc-500 hover:underline"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            data-testid="broadcast-review"
            onClick={() => setConfirming(true)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Review &amp; send
          </button>
        )}
      </div>
    </form>
  );
}
