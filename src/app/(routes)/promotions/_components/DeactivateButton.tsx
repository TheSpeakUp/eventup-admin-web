// src/app/(routes)/promotions/_components/DeactivateButton.tsx
"use client";
import { useActionState } from "react";
import { EMPTY_STATE, type ActionState } from "../action-types";

type DeactivateAction = (
  prev: ActionState,
  fd: FormData,
) => Promise<ActionState>;

export default function DeactivateButton({
  id,
  action,
  testid,
  confirmLabel,
}: {
  id: number;
  action: DeactivateAction;
  testid: string;
  confirmLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);
  return (
    <form
      action={formAction}
      data-testid={`${testid}-form`}
      onSubmit={(e) => {
        if (!confirm(confirmLabel)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        data-testid={testid}
        className="rounded border border-amber-300 px-2 py-0.5 text-xs text-amber-800 disabled:opacity-50"
      >
        {pending ? "…" : "Deactivate"}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid={`${testid}-error`} className="text-xs text-red-300">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
