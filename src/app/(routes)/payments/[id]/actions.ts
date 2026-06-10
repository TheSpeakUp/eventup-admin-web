"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { refundPayment } from "@/lib/payments/api";
import type { RefundActionState } from "./action-types";

const idSchema = z.coerce.number().int().positive("payment id is required");
// The panel converts the operator's major-unit input to integer minor units
// client-side (currency-exponent aware); the action only sees minor units.
const amountSchema = z.coerce
  .number()
  .int("Amount must be a whole number of minor units")
  .positive("Amount must be positive")
  .optional();
const reasonSchema = z.string().trim().max(500).optional();

function fail(message: string): RefundActionState {
  return { ok: false, error: message };
}

export async function refundPaymentAction(
  _prev: RefundActionState,
  formData: FormData,
): Promise<RefundActionState> {
  const idR = idSchema.safeParse(formData.get("paymentId"));
  if (!idR.success)
    return fail(idR.error.issues[0]?.message ?? "Invalid payment id");

  const rawAmount = formData.get("amountMinor");
  let amountMinor: number | undefined;
  if (rawAmount !== null && rawAmount !== "") {
    const amountR = amountSchema.safeParse(rawAmount);
    if (!amountR.success)
      return fail(amountR.error.issues[0]?.message ?? "Invalid amount");
    amountMinor = amountR.data;
  }

  const rawReason = formData.get("reason");
  let reason: string | undefined;
  if (rawReason !== null && rawReason !== "") {
    const reasonR = reasonSchema.safeParse(rawReason);
    if (!reasonR.success)
      return fail(reasonR.error.issues[0]?.message ?? "Invalid reason");
    reason = reasonR.data;
  }

  const result = await refundPayment(idR.data, {
    ...(amountMinor !== undefined ? { amount_minor: amountMinor } : {}),
    ...(reason !== undefined ? { reason } : {}),
  });
  if (!result.ok)
    return fail(result.message ?? `Request failed (${result.status})`);

  revalidatePath(`/payments/${idR.data}`);
  revalidatePath("/payments");
  return { ok: true, error: null };
}
