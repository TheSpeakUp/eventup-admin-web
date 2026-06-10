"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { formatDateTime, formatMoneyMinor, minorUnitExponent } from "@/lib/format";
import type { RefundRead } from "@/lib/payments/types";
import { refundPaymentAction } from "../actions";
import { EMPTY_REFUND_STATE } from "../action-types";

// Refund action + history for one payment (M5 refund-write).
//
// Amount input is in MAJOR units (what the operator reads on the receipt) and
// converted to integer minor units here, currency-exponent aware (JPY has no
// cents). Empty amount ⇒ full remaining refund. A partial refund keeps the
// purchased service running; only the refund that exhausts the charged total
// revokes it — mirrored from the backend semantics, stated in the dialog.
export default function RefundPanel({
  paymentId,
  currency,
  refundableAmountMinor,
  refundedAmountMinor,
  refunds,
}: {
  paymentId: number;
  currency: string;
  refundableAmountMinor: number;
  refundedAmountMinor: number;
  refunds: RefundRead[];
}) {
  const [open, setOpen] = useState(false);
  const [amountMajor, setAmountMajor] = useState("");
  const [state, formAction, pending] = useActionState(
    refundPaymentAction,
    EMPTY_REFUND_STATE,
  );
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.show();
    if (!open && el.open) el.close();
  }, [open]);

  // On success only close the <dialog> imperatively; the dialog's onClose
  // event handler resets the React state (lint: no setState inside effects).
  useEffect(() => {
    if (pending) return;
    if (state.ok) dialogRef.current?.close();
  }, [state, pending]);

  function handleDialogClose() {
    setOpen(false);
    if (state.ok) setAmountMajor("");
  }

  const exponent = minorUnitExponent(currency);
  const parsedMajor = amountMajor === "" ? null : Number(amountMajor);
  const amountMinor =
    parsedMajor !== null && Number.isFinite(parsedMajor) && parsedMajor > 0
      ? Math.round(parsedMajor * 10 ** exponent)
      : null;
  const amountTooHigh =
    amountMinor !== null && amountMinor > refundableAmountMinor;
  const isFull = amountMinor === null || amountMinor === refundableAmountMinor;
  const canRefund = refundableAmountMinor > 0;

  return (
    <div
      className="rounded-md border border-zinc-200 bg-white p-6"
      data-testid="refund-panel"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Refunds
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Refunded{" "}
            <span data-testid="refunded-total" className="font-medium">
              {formatMoneyMinor(refundedAmountMinor, currency)}
            </span>{" "}
            · Refundable{" "}
            <span data-testid="refundable-total" className="font-medium">
              {formatMoneyMinor(refundableAmountMinor, currency)}
            </span>
          </p>
        </div>
        <button
          type="button"
          data-testid="refund-open"
          disabled={!canRefund}
          onClick={() => setOpen(true)}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Refund…
        </button>
      </div>

      {refunds.length > 0 ? (
        <table className="mt-4 w-full text-sm" data-testid="refunds-table">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="py-1.5 pr-4 font-medium">Amount</th>
              <th className="py-1.5 pr-4 font-medium">Status</th>
              <th className="py-1.5 pr-4 font-medium">Reason</th>
              <th className="py-1.5 pr-4 font-medium">Stripe ref</th>
              <th className="py-1.5 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((r) => (
              <tr
                key={r.id}
                className="border-b border-zinc-50"
                data-testid={`refund-row-${r.id}`}
              >
                <td className="py-2 pr-4 font-medium text-zinc-900">
                  {formatMoneyMinor(r.amount_minor, r.currency)}
                </td>
                <td className="py-2 pr-4">{r.status}</td>
                <td className="py-2 pr-4 text-zinc-600">{r.reason ?? "—"}</td>
                <td className="py-2 pr-4 font-mono text-xs">
                  {r.stripe_refund_id ?? "—"}
                </td>
                <td className="py-2 text-zinc-600">
                  {formatDateTime(r.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-3 text-sm text-zinc-400" data-testid="refunds-empty">
          No refunds yet.
        </p>
      )}

      <dialog
        ref={dialogRef}
        onClose={handleDialogClose}
        className="w-full max-w-md rounded-lg border border-zinc-200 p-0 shadow-xl backdrop:bg-zinc-900/30"
      >
        {open ? (
          <form
            action={formAction}
            className="space-y-4 p-5"
            data-testid="refund-form"
          >
            <input type="hidden" name="paymentId" value={paymentId} />
            <input
              type="hidden"
              name="amountMinor"
              value={amountMinor ?? ""}
            />
            <div>
              <h3 className="text-base font-semibold text-zinc-900">
                Refund payment #{paymentId}
              </h3>
              <p className="mt-1 text-sm text-zinc-600">
                {isFull
                  ? "Full refund: the purchased promotion/publication is cancelled."
                  : "Partial refund: the purchased service keeps running."}{" "}
                Money goes back via Stripe — this cannot be undone.
              </p>
            </div>
            <label className="block text-sm">
              <span className="text-zinc-600">
                Amount ({currency}) — leave empty for the full remaining{" "}
                {formatMoneyMinor(refundableAmountMinor, currency)}
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step={exponent === 0 ? "1" : "0.01"}
                value={amountMajor}
                onChange={(e) => setAmountMajor(e.target.value)}
                data-testid="refund-amount"
                className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-sm focus:border-zinc-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-600">Reason (optional)</span>
              <textarea
                name="reason"
                rows={3}
                maxLength={500}
                data-testid="refund-reason"
                className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-sm focus:border-zinc-500 focus:outline-none"
              />
            </label>
            {amountTooHigh ? (
              <p className="text-sm text-red-700" data-testid="refund-amount-error">
                Exceeds the refundable remaining{" "}
                {formatMoneyMinor(refundableAmountMinor, currency)}.
              </p>
            ) : null}
            {state.error ? (
              <p className="text-sm text-red-700" data-testid="refund-error">
                {state.error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                data-testid="refund-cancel"
                onClick={() => setOpen(false)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending || amountTooHigh}
                data-testid="refund-submit"
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:bg-zinc-400"
              >
                {pending
                  ? "Refunding…"
                  : isFull
                    ? "Refund full amount"
                    : "Refund"}
              </button>
            </div>
          </form>
        ) : null}
      </dialog>
    </div>
  );
}
