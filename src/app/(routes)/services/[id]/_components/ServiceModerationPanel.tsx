"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  approveServiceAction,
  archiveServiceAction,
  rejectServiceAction,
  republishServiceAction,
  unpublishServiceAction,
} from "../actions";
import { EMPTY_STATE, type ActionState } from "../action-types";
import type { ServiceStatus } from "@/lib/services/types";

type Kind = "approve" | "reject" | "unpublish" | "republish" | "archive";

type DialogConfig = {
  title: string;
  body: string;
  needsReason: boolean;
  reasonOptional?: boolean;
  confirmLabel: string;
};

const DIALOGS: Record<Kind, DialogConfig> = {
  approve: {
    title: "Approve service?",
    body: "Transition on_review → published. Service becomes visible in the marketplace.",
    needsReason: false,
    confirmLabel: "Approve",
  },
  reject: {
    title: "Reject service",
    body: "Provide a reason (10+ chars). Service returns to draft.",
    needsReason: true,
    confirmLabel: "Reject",
  },
  unpublish: {
    title: "Unpublish service?",
    body: "Optional reason (10+ chars if provided). Service hidden from the marketplace.",
    needsReason: true,
    reasonOptional: true,
    confirmLabel: "Unpublish",
  },
  republish: {
    title: "Republish service?",
    body: "Restore published state.",
    needsReason: false,
    confirmLabel: "Republish",
  },
  archive: {
    title: "Archive service?",
    body: "Optional reason (10+ chars if provided). Archived services are not surfaced in any state.",
    needsReason: true,
    reasonOptional: true,
    confirmLabel: "Archive",
  },
};

const ACTIONS: Record<
  Kind,
  (prev: ActionState, fd: FormData) => Promise<ActionState>
> = {
  approve: approveServiceAction,
  reject: rejectServiceAction,
  unpublish: unpublishServiceAction,
  republish: republishServiceAction,
  archive: archiveServiceAction,
};

function ActionForm({
  kind,
  serviceId,
  onSettled,
}: {
  kind: Kind;
  serviceId: number;
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
          required={!cfg.reasonOptional}
          minLength={10}
          rows={4}
          data-testid={`moderation-reason-${kind}`}
          placeholder={cfg.reasonOptional ? "Reason (optional, min 10 chars)…" : "Reason (min 10 chars)…"}
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

const ALL_KINDS: { kind: Kind; label: string; className: string }[] = [
  { kind: "approve", label: "Approve", className: "bg-emerald-600 text-white hover:bg-emerald-700" },
  { kind: "reject", label: "Reject", className: "bg-red-600 text-white hover:bg-red-700" },
  { kind: "unpublish", label: "Unpublish", className: "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50" },
  { kind: "republish", label: "Republish", className: "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50" },
  { kind: "archive", label: "Archive", className: "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50" },
];

export default function ServiceModerationPanel({
  serviceId,
  status: _status,
}: {
  serviceId: number;
  status: ServiceStatus;
}) {
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
      {ALL_KINDS.map(({ kind, label, className }) => (
        <button
          key={kind}
          type="button"
          onClick={() => setOpen(kind)}
          data-testid={`moderation-open-${kind}`}
          className={`w-full rounded-md px-3 py-2 text-sm font-medium ${className}`}
        >
          {label}
        </button>
      ))}

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
