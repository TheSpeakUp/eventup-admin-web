"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { formatDateTime, formatMoneyMinor, minorUnitExponent } from "@/lib/format";
import type { RefundRead } from "@/lib/payments/types";
import { refundPaymentAction } from "../actions";
import { EMPTY_REFUND_STATE } from "../action-types";
import Button from "@/app/_components/ui/Button";
import EmptyState from "@/app/_components/ui/EmptyState";
import { Input, Textarea } from "@/app/_components/ui/FormField";
import { Table, THead, TBody, Tr, Th, Td } from "@/app/_components/ui/Table";

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
      className="rounded-lg border border-hairline bg-surface-1 p-6"
      data-testid="refund-panel"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-ink-subtle">
            Refunds
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
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
        <Button
          type="button"
          variant="danger"
          data-testid="refund-open"
          disabled={!canRefund}
          onClick={() => setOpen(true)}
        >
          Refund…
        </Button>
      </div>

      {refunds.length > 0 ? (
        <div className="mt-4" data-testid="refunds-table">
          <Table>
            <THead>
              <Tr>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Reason</Th>
                <Th>Stripe ref</Th>
                <Th>Date</Th>
              </Tr>
            </THead>
            <TBody>
              {refunds.map((r) => (
                <Tr key={r.id} data-testid={`refund-row-${r.id}`}>
                  <Td className="font-medium">
                    {formatMoneyMinor(r.amount_minor, r.currency)}
                  </Td>
                  <Td>{r.status}</Td>
                  <Td className="text-ink-muted">{r.reason ?? "—"}</Td>
                  <Td className="font-mono text-xs">
                    {r.stripe_refund_id ?? "—"}
                  </Td>
                  <Td className="text-ink-muted">
                    {formatDateTime(r.created_at)}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </div>
      ) : (
        <EmptyState testid="refunds-empty" className="mt-3">
          No refunds yet.
        </EmptyState>
      )}

      <dialog
        ref={dialogRef}
        onClose={handleDialogClose}
        className="w-full max-w-md rounded-lg border border-hairline bg-surface-1 p-0 shadow-xl backdrop:bg-primary/30"
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
              <h3 className="text-base font-semibold text-ink">
                Refund payment #{paymentId}
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                {isFull
                  ? "Full refund: the purchased promotion/publication is cancelled."
                  : "Partial refund: the purchased service keeps running."}{" "}
                Money goes back via Stripe — this cannot be undone.
              </p>
            </div>
            <label className="block text-sm">
              <span className="text-ink-muted">
                Amount ({currency}) — leave empty for the full remaining{" "}
                {formatMoneyMinor(refundableAmountMinor, currency)}
              </span>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step={exponent === 0 ? "1" : "0.01"}
                value={amountMajor}
                onChange={(e) => setAmountMajor(e.target.value)}
                data-testid="refund-amount"
                className="mt-1"
              />
            </label>
            <label className="block text-sm">
              <span className="text-ink-muted">Reason (optional)</span>
              <Textarea
                name="reason"
                rows={3}
                maxLength={500}
                data-testid="refund-reason"
                className="mt-1"
              />
            </label>
            {amountTooHigh ? (
              <p className="text-sm text-red-400" data-testid="refund-amount-error">
                Exceeds the refundable remaining{" "}
                {formatMoneyMinor(refundableAmountMinor, currency)}.
              </p>
            ) : null}
            {state.error ? (
              <p className="text-sm text-red-400" data-testid="refund-error">
                {state.error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                data-testid="refund-cancel"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={pending || amountTooHigh}
                data-testid="refund-submit"
              >
                {pending
                  ? "Refunding…"
                  : isFull
                    ? "Refund full amount"
                    : "Refund"}
              </Button>
            </div>
          </form>
        ) : null}
      </dialog>
    </div>
  );
}
