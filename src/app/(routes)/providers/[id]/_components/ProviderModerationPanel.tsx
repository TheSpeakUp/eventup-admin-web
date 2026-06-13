"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import ErrorToast from "@/app/_components/ErrorToast";
import {
  providerActionUnavailableReason,
  providerActionsForStatus,
  type ProviderActionKind,
} from "@/lib/moderation/transitions";
import type { ProviderStatus } from "@/lib/providers/types";
import {
  blockProviderAction,
  deleteProviderAction,
  unblockProviderAction,
  verifyProviderAction,
} from "../actions";
import { EMPTY_STATE, type ActionState } from "../action-types";
import Button from "@/app/_components/ui/Button";
import { Textarea } from "@/app/_components/ui/FormField";

type Kind = ProviderActionKind;

type DialogConfig = {
  title: string;
  body: string;
  needsReason: boolean;
  reasonField: "reason" | "message" | null;
  confirmLabel: string;
};

const DIALOGS: Record<Kind, DialogConfig> = {
  verify: {
    title: "Verify provider?",
    body: "Mark provider as verified. Optional verification note.",
    needsReason: true,
    reasonField: "message",
    confirmLabel: "Verify",
  },
  block: {
    title: "Block provider",
    body: "Provide a reason (10+ chars). Provider will be hidden from the marketplace.",
    needsReason: true,
    reasonField: "reason",
    confirmLabel: "Block",
  },
  unblock: {
    title: "Unblock provider?",
    body: "Return provider to verified state.",
    needsReason: false,
    reasonField: null,
    confirmLabel: "Unblock",
  },
  delete: {
    title: "Delete provider?",
    body: "Soft-delete (transition to canceled). This cannot be undone via this UI.",
    needsReason: false,
    reasonField: null,
    confirmLabel: "Delete",
  },
};

const ACTIONS: Record<
  Kind,
  (prev: ActionState, fd: FormData) => Promise<ActionState>
> = {
  verify: verifyProviderAction,
  block: blockProviderAction,
  unblock: unblockProviderAction,
  delete: deleteProviderAction,
};

function ActionForm({
  kind,
  providerId,
  onSettled,
}: {
  kind: Kind;
  providerId: number;
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
  const isMessage = cfg.reasonField === "message";
  return (
    <form action={formAction} className="space-y-3" data-testid={`moderation-form-${kind}`}>
      <input type="hidden" name="providerId" value={providerId} />
      {cfg.needsReason && cfg.reasonField ? (
        <Textarea
          name={cfg.reasonField}
          required={!isMessage}
          minLength={isMessage ? 0 : 10}
          rows={4}
          data-testid={`moderation-reason-${kind}`}
          placeholder={
            isMessage ? "Verification note (optional)…" : "Reason (min 10 chars)…"
          }
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
          variant="primary"
          disabled={pending}
          data-testid={`moderation-submit-${kind}`}
        >
          {pending ? "Submitting…" : cfg.confirmLabel}
        </Button>
      </div>
    </form>
  );
}

const ALL_KINDS: { kind: Kind; label: string; className: string }[] = [
  { kind: "verify", label: "Verify", className: "bg-emerald-600 text-white hover:bg-emerald-700" },
  { kind: "block", label: "Block", className: "bg-red-600 text-white hover:bg-red-700" },
  { kind: "unblock", label: "Unblock", className: "border border-zinc-300 bg-surface-1 text-zinc-700 hover:bg-zinc-50" },
  { kind: "delete", label: "Delete", className: "border border-zinc-300 bg-surface-1 text-zinc-700 hover:bg-zinc-50" },
];

const DISABLED_CLASS =
  "w-full rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-400 cursor-not-allowed";

export default function ProviderModerationPanel({
  providerId,
  status,
}: {
  providerId: number;
  status: ProviderStatus;
}) {
  const [open, setOpen] = useState<Kind | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const allowed = providerActionsForStatus(status);

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
      {ALL_KINDS.map(({ kind, label, className }) => {
        const isAllowed = allowed.has(kind);
        if (!isAllowed) {
          return (
            <button
              key={kind}
              type="button"
              disabled
              title={providerActionUnavailableReason(kind, status)}
              data-testid={`moderation-open-${kind}`}
              data-disabled-reason={providerActionUnavailableReason(kind, status)}
              className={DISABLED_CLASS}
            >
              {label}
            </button>
          );
        }
        return (
          <button
            key={kind}
            type="button"
            onClick={() => setOpen(kind)}
            data-testid={`moderation-open-${kind}`}
            className={`w-full rounded-md px-3 py-2 text-sm font-medium ${className}`}
          >
            {label}
          </button>
        );
      })}

      <dialog
        ref={dialogRef}
        data-testid="moderation-dialog"
        onClose={() => setOpen(null)}
        className="rounded-lg border border-hairline bg-surface-1 p-0 backdrop:bg-black/40"
      >
        {open && cfg ? (
          <div className="w-[420px] p-5">
            <h2 className="text-lg font-semibold text-ink">{cfg.title}</h2>
            <p className="mt-1 text-sm text-ink-muted">{cfg.body}</p>
            <div className="mt-4">
              <ActionForm
                key={open}
                kind={open}
                providerId={providerId}
                onSettled={handleSettled}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
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
