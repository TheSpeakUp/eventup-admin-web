"use client";

import { useEffect, useRef, useState } from "react";
import { useStepUpForm } from "@/app/_components/step-up/useStepUpForm";
import ErrorToast from "@/app/_components/ErrorToast";
import Button from "@/app/_components/ui/Button";
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

  const buttonVariant = variant === "ghost" ? "secondary" : variant;

  return (
    <div className="space-y-1">
      <form action={formAction} className="flex flex-col gap-1">
        {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        {!confirmed ? (
          <Button
            variant={buttonVariant}
            type="button"
            data-testid={`${testid}-open`}
            onClick={() => setConfirmed(true)}
          >
            {label}
          </Button>
        ) : (
          <div className="flex flex-col gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 p-2">
            <p className="text-xs text-amber-300">{description}</p>
            <div className="flex gap-2">
              <Button
                variant={buttonVariant}
                type="submit"
                disabled={pending}
                data-testid={`${testid}-confirm`}
              >
                {pending ? "Running…" : `Confirm: ${label}`}
              </Button>
              <Button
                variant="secondary"
                type="button"
                data-testid={`${testid}-cancel`}
                onClick={() => setConfirmed(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </form>
      {state.message ? (
        <p data-testid={`${testid}-result`} className="text-xs text-emerald-400">
          {state.message}
        </p>
      ) : null}
      <ErrorToast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default function ForceDispatchButtons() {
  return (
    <section data-testid="force-dispatch" className="space-y-3 rounded-lg border border-hairline bg-surface-1 p-3">
      <h2 className="text-sm font-semibold text-ink">Force dispatch</h2>
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
