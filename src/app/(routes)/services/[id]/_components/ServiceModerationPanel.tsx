"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import ErrorToast from "@/app/_components/ErrorToast";
import {
  serviceActionUnavailableReason,
  serviceActionsForStatus,
  type ServiceActionKind,
} from "@/lib/moderation/transitions";
import type { ServiceStatus } from "@/lib/services/types";
import {
  approveServiceAction,
  archiveServiceAction,
  rejectServiceAction,
  republishServiceAction,
  unpublishServiceAction,
} from "../actions";
import { EMPTY_STATE, type ActionState } from "../action-types";
import Button, { type ButtonVariant } from "@/app/_components/ui/Button";
import { Textarea } from "@/app/_components/ui/FormField";

type Kind = ServiceActionKind;

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
  onSettled: (ok: boolean, error: string | null) => void;
}) {
  const [state, formAction, pending] = useActionState(ACTIONS[kind], EMPTY_STATE);
  const lastReported = useRef<{ ok: boolean; error: string | null } | null>(null);
  useEffect(() => {
    if (pending) return;
    if (state === EMPTY_STATE) return;
    const prev = lastReported.current;
    if (prev && prev.ok === state.ok && prev.error === state.error) return;
    lastReported.current = { ok: state.ok, error: state.error };
    onSettled(state.ok, state.error);
  }, [state, pending, onSettled]);
  const cfg = DIALOGS[kind];
  return (
    <form action={formAction} className="space-y-3" data-testid={`moderation-form-${kind}`}>
      <input type="hidden" name="serviceId" value={serviceId} />
      {cfg.needsReason ? (
        <Textarea
          name="reason"
          required={!cfg.reasonOptional}
          minLength={10}
          rows={4}
          data-testid={`moderation-reason-${kind}`}
          placeholder={cfg.reasonOptional ? "Reason (optional, min 10 chars)…" : "Reason (min 10 chars)…"}
        />
      ) : null}
      {state.error ? (
        <p data-testid={`moderation-error-${kind}`} className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={pending}
          data-testid={`moderation-submit-${kind}`}
        >
          {pending ? "Submitting…" : cfg.confirmLabel}
        </Button>
      </div>
    </form>
  );
}

const ALL_KINDS: { kind: Kind; label: string; variant: ButtonVariant }[] = [
  { kind: "approve", label: "Approve", variant: "primary" },
  { kind: "reject", label: "Reject", variant: "danger" },
  { kind: "unpublish", label: "Unpublish", variant: "secondary" },
  { kind: "republish", label: "Republish", variant: "secondary" },
  { kind: "archive", label: "Archive", variant: "secondary" },
];

export default function ServiceModerationPanel({
  serviceId,
  status,
}: {
  serviceId: number;
  status: ServiceStatus;
}) {
  const [open, setOpen] = useState<Kind | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const allowed = serviceActionsForStatus(status);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.show();
    if (!open && el.open) el.close();
  }, [open]);

  function handleSettled(ok: boolean, error: string | null) {
    dialogRef.current?.close();
    setOpen(null);
    if (ok) {
      setToast(null);
    } else if (error) {
      setToast(error);
    }
  }

  const cfg = open ? DIALOGS[open] : null;

  return (
    <div className="space-y-2" data-testid="moderation-panel" data-status={status}>
      {ALL_KINDS.map(({ kind, label, variant }) => {
        const isAllowed = allowed.has(kind);
        if (!isAllowed) {
          return (
            <Button
              key={kind}
              variant="secondary"
              type="button"
              disabled
              title={serviceActionUnavailableReason(kind, status)}
              data-testid={`moderation-open-${kind}`}
              data-disabled-reason={serviceActionUnavailableReason(kind, status)}
              className="w-full"
            >
              {label}
            </Button>
          );
        }
        return (
          <Button
            key={kind}
            variant={variant}
            type="button"
            onClick={() => setOpen(kind)}
            data-testid={`moderation-open-${kind}`}
            className="w-full"
          >
            {label}
          </Button>
        );
      })}

      <dialog
        ref={dialogRef}
        data-testid="moderation-dialog"
        onClose={() => setOpen(null)}
        className="rounded-lg border border-hairline bg-surface-1 p-0 text-ink backdrop:bg-black/60"
      >
        {open && cfg ? (
          <div className="w-[420px] p-5">
            <h2 className="text-lg font-semibold text-ink">{cfg.title}</h2>
            <p className="mt-1 text-sm text-ink-subtle">{cfg.body}</p>
            <div className="mt-4">
              <ActionForm
                key={open}
                kind={open}
                serviceId={serviceId}
                onSettled={handleSettled}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setOpen(null)}
                data-testid="moderation-cancel"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </dialog>

      <ErrorToast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
