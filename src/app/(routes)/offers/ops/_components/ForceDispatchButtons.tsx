"use client";

import { useEffect, useRef, useState } from "react";
import { useStepUpForm } from "@/app/_components/step-up/useStepUpForm";
import ErrorToast from "@/app/_components/ErrorToast";
import {
  forceOfferDispatchAction,
  forceProviderDispatchAction,
  replayDlqAction,
} from "../actions";
import { EMPTY_OPS_STATE, type OpsActionState } from "../action-types";

type OpsAction = (prev: OpsActionState, fd: FormData) => Promise<OpsActionState>;

function applyOpsSettled(
  state: OpsActionState,
  confirmed: boolean,
  setToast: (s: string | null) => void,
  setConfirmed: (b: boolean) => void,
): void {
  if (state.error) setToast(state.error);
  if (state.ok && confirmed) setConfirmed(false);
}

function ConfirmButton({
  testid,
  label,
  description,
  action,
  permission,
  hiddenFields,
  variant = "primary",
}: {
  testid: string;
  label: string;
  description: string;
  action: OpsAction;
  permission: string;
  hiddenFields?: Record<string, string>;
  variant?: "primary" | "danger" | "ghost";
}) {
  const [state, formAction, pending] = useStepUpForm(action, EMPTY_OPS_STATE, permission);
  const [confirmed, setConfirmed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const lastSettled = useRef<OpsActionState | null>(null);

  useEffect(() => {
    if (state === EMPTY_OPS_STATE) return;
    if (lastSettled.current === state) return;
    lastSettled.current = state;
    applyOpsSettled(state, confirmed, setToast, setConfirmed);
  }, [state, confirmed]);

  const className =
    variant === "danger"
      ? "rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:bg-zinc-400"
      : variant === "ghost"
      ? "rounded-md border border-zinc-300 bg-surface-1 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:text-zinc-400"
      : "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:bg-zinc-400";

  return (
    <div className="space-y-1">
      <form action={formAction} className="flex flex-col gap-1">
        {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        {!confirmed ? (
          <button
            type="button"
            data-testid={`${testid}-open`}
            onClick={() => setConfirmed(true)}
            className={className}
          >
            {label}
          </button>
        ) : (
          <div className="flex flex-col gap-1 rounded-md border border-amber-300 bg-amber-50 p-2">
            <p className="text-xs text-amber-900">{description}</p>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                data-testid={`${testid}-confirm`}
                className={className}
              >
                {pending ? "Running…" : `Confirm: ${label}`}
              </button>
              <button
                type="button"
                data-testid={`${testid}-cancel`}
                onClick={() => setConfirmed(false)}
                className="rounded-md border border-zinc-300 bg-surface-1 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </form>
      {state.message ? (
        <p data-testid={`${testid}-result`} className="text-xs text-emerald-300">
          {state.message}
        </p>
      ) : null}
      <ErrorToast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default function ForceDispatchButtons() {
  return (
    <section data-testid="force-dispatch" className="space-y-3 rounded-md border border-zinc-200 bg-surface-1 p-3">
      <h2 className="text-sm font-semibold">Force dispatch</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <ConfirmButton
          testid="force-offer-dispatch"
          label="Force offer dispatch"
          description="Sends push/email reminders to speakers with on_review offers, auto-closes overdue ones."
          action={forceOfferDispatchAction}
          permission="admin.marketplace.offers.dispatch"
        />
        <ConfirmButton
          testid="force-provider-dispatch"
          label="Force provider dispatch"
          description="Sends escalation notifications to providers with overdue offers."
          action={forceProviderDispatchAction}
          permission="admin.marketplace.providers.dispatch"
        />
        <ConfirmButton
          testid="dlq-replay-dry"
          label="DLQ replay — dry run"
          description="Counts what would be retried. Sends nothing."
          action={replayDlqAction}
          permission="admin.marketplace.providers.dispatch"
          hiddenFields={{ mode: "dry_run" }}
          variant="ghost"
        />
        <ConfirmButton
          testid="dlq-replay-apply"
          label="DLQ replay — apply"
          description="Actually retries failed deliveries. Side-effects persist."
          action={replayDlqAction}
          permission="admin.marketplace.providers.dispatch"
          hiddenFields={{ mode: "apply" }}
          variant="danger"
        />
      </div>
    </section>
  );
}
