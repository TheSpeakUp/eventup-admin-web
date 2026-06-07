"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  approveServiceAction,
  hideServiceAction,
  rejectServiceAction,
  requestChangesServiceAction,
  restoreServiceAction,
} from "../actions";
import { EMPTY_STATE, type ActionState } from "../action-types";

type Kind = "approve" | "reject" | "request_changes" | "hide" | "restore";

type DialogConfig = {
  title: string;
  body: string;
  needsReason: boolean;
  confirmLabel: string;
};

const DIALOGS: Record<Kind, DialogConfig> = {
  approve: {
    title: "Approve service?",
    body: "This will publish the service to the marketplace.",
    needsReason: false,
    confirmLabel: "Approve",
  },
  reject: {
    title: "Reject service",
    body: "Provide a reason (10+ chars). The provider will see it.",
    needsReason: true,
    confirmLabel: "Reject",
  },
  request_changes: {
    title: "Request changes",
    body: "Describe what needs to change (10+ chars).",
    needsReason: true,
    confirmLabel: "Send request",
  },
  hide: {
    title: "Hide service from marketplace?",
    body: "The service will no longer be visible to buyers.",
    needsReason: false,
    confirmLabel: "Hide",
  },
  restore: {
    title: "Restore visibility?",
    body: "Restore the service to a visible state.",
    needsReason: false,
    confirmLabel: "Restore",
  },
};

const ACTIONS: Record<
  Kind,
  (prev: ActionState, fd: FormData) => Promise<ActionState>
> = {
  approve: approveServiceAction,
  reject: rejectServiceAction,
  request_changes: requestChangesServiceAction,
  hide: hideServiceAction,
  restore: restoreServiceAction,
};

function ActionForm({
  kind,
  serviceId,
  onSettled,
}: {
  kind: Kind;
  serviceId: string;
  onSettled: (ok: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(ACTIONS[kind], EMPTY_STATE);
  const lastReportedOk = useRef<boolean | null>(null);
  useEffect(() => {
    if (pending) return;
    if (state === EMPTY_STATE) return;
    if (state.ok && lastReportedOk.current !== true) {
      lastReportedOk.current = true;
      onSettled(true);
    }
  }, [state, pending, onSettled]);
  const cfg = DIALOGS[kind];
  return (
    <form action={formAction} className="space-y-3" data-testid={`moderation-form-${kind}`}>
      <input type="hidden" name="serviceId" value={serviceId} />
      {cfg.needsReason ? (
        <textarea
          name="reason"
          required
          minLength={10}
          rows={4}
          data-testid={`moderation-reason-${kind}`}
          placeholder="Reason (min 10 chars)…"
          className="w-full rounded-md border border-zinc-300 p-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      ) : null}
      {state.error ? (
        <p data-testid={`moderation-error-${kind}`} className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={pending}
          data-testid={`moderation-submit-${kind}`}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-400"
        >
          {pending ? "Submitting…" : cfg.confirmLabel}
        </button>
      </div>
    </form>
  );
}

export default function ServiceModerationPanel({ serviceId }: { serviceId: string }) {
  const [open, setOpen] = useState<Kind | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  function handleSettled(ok: boolean) {
    if (ok) setOpen(null);
  }

  const cfg = open ? DIALOGS[open] : null;

  return (
    <div className="space-y-2" data-testid="moderation-panel">
      <button
        type="button"
        onClick={() => setOpen("approve")}
        data-testid="moderation-open-approve"
        className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => setOpen("request_changes")}
        data-testid="moderation-open-request_changes"
        className="w-full rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
      >
        Request changes
      </button>
      <button
        type="button"
        onClick={() => setOpen("reject")}
        data-testid="moderation-open-reject"
        className="w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        Reject
      </button>
      <button
        type="button"
        onClick={() => setOpen("hide")}
        data-testid="moderation-open-hide"
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        Hide
      </button>
      <button
        type="button"
        onClick={() => setOpen("restore")}
        data-testid="moderation-open-restore"
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        Restore
      </button>

      <dialog
        ref={dialogRef}
        data-testid="moderation-dialog"
        onClose={() => setOpen(null)}
        className="rounded-md border border-zinc-200 p-0 backdrop:bg-black/40"
      >
        {open && cfg ? (
          <div className="w-[420px] p-5">
            <h2 className="text-lg font-semibold">{cfg.title}</h2>
            <p className="mt-1 text-sm text-zinc-600">{cfg.body}</p>
            <div className="mt-4">
              <ActionForm
                key={open}
                kind={open}
                serviceId={serviceId}
                onSettled={handleSettled}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(null)}
                data-testid="moderation-cancel"
                className="text-xs text-zinc-500 hover:text-zinc-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
