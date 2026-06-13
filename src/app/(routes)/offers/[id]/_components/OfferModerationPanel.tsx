"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import ErrorToast from "@/app/_components/ErrorToast";
import {
  offerActionUnavailableReason,
  offerActionsForStatus,
  type OfferActionKind,
} from "@/lib/moderation/transitions";
import type { OfferStatus } from "@/lib/offers/types";
import {
  approveOfferAction,
  archiveOfferAction,
  disableOfferAction,
  enableOfferAction,
  rejectOfferAction,
} from "../actions";
import { EMPTY_STATE, type ActionState } from "../action-types";
import Button, { type ButtonVariant } from "@/app/_components/ui/Button";
import { Textarea } from "@/app/_components/ui/FormField";

type Kind = OfferActionKind;

type DialogConfig = {
  title: string;
  body: string;
  needsReason: boolean;
  reasonOptional?: boolean;
  confirmLabel: string;
};

const DIALOGS: Record<Kind, DialogConfig> = {
  approve: {
    title: "Approve offer?",
    body: "Transition on_review → active. Offer becomes live in the marketplace.",
    needsReason: false,
    confirmLabel: "Approve",
  },
  reject: {
    title: "Reject offer",
    body: "Provide a reason (10+ chars). Offer transitions to rejected.",
    needsReason: true,
    confirmLabel: "Reject",
  },
  archive: {
    title: "Archive offer?",
    body: "Optional reason (10+ chars if provided). Archived offers stay hidden.",
    needsReason: true,
    reasonOptional: true,
    confirmLabel: "Archive",
  },
  disable: {
    title: "Disable offer?",
    body: "Optional reason (10+ chars if provided). Offer becomes invisible to users.",
    needsReason: true,
    reasonOptional: true,
    confirmLabel: "Disable",
  },
  enable: {
    title: "Enable offer?",
    body: "Restore active state.",
    needsReason: false,
    confirmLabel: "Enable",
  },
};

const ACTIONS: Record<
  Kind,
  (prev: ActionState, fd: FormData) => Promise<ActionState>
> = {
  approve: approveOfferAction,
  reject: rejectOfferAction,
  archive: archiveOfferAction,
  disable: disableOfferAction,
  enable: enableOfferAction,
};

function ActionForm({
  kind,
  offerId,
  onSettled,
}: {
  kind: Kind;
  offerId: number;
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
      <input type="hidden" name="offerId" value={offerId} />
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
  { kind: "archive", label: "Archive", variant: "secondary" },
  { kind: "disable", label: "Disable", variant: "secondary" },
  { kind: "enable", label: "Enable", variant: "secondary" },
];

export default function OfferModerationPanel({
  offerId,
  status,
}: {
  offerId: number;
  status: OfferStatus;
}) {
  const [open, setOpen] = useState<Kind | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const allowed = offerActionsForStatus(status);

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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {ALL_KINDS.map(({ kind, label, variant }) => {
          const isAllowed = allowed.has(kind);
          if (!isAllowed) {
            return (
              <Button
                key={kind}
                variant="secondary"
                type="button"
                disabled
                title={offerActionUnavailableReason(kind, status)}
                data-testid={`moderation-open-${kind}`}
                data-disabled-reason={offerActionUnavailableReason(kind, status)}
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
      </div>

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
                offerId={offerId}
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
