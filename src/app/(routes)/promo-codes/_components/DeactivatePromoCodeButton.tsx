// src/app/(routes)/promo-codes/_components/DeactivatePromoCodeButton.tsx
"use client";
import { useActionState } from "react";
import { deactivatePromoCodeAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

export default function DeactivatePromoCodeButton({ id }: { id: number }) {
  const [state, formAction, pending] = useActionState(
    deactivatePromoCodeAction,
    EMPTY_STATE,
  );
  return (
    <form
      action={formAction}
      data-testid="promo-deactivate-form"
      onSubmit={(e) => {
        if (!confirm("Deactivate this promo code? It will stop applying at checkout.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        data-testid="promo-deactivate"
        className="rounded border border-amber-300 px-2 py-0.5 text-xs text-amber-800 disabled:opacity-50"
      >
        {pending ? "…" : "Deactivate"}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="promo-deactivate-error" className="text-xs text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
