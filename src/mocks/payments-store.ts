import type {
  PaymentDetail,
  PaymentListItem,
  PaymentListQuery,
} from "@/lib/payments/types";
import { buildFixturePayments } from "./payments-fixtures";
import type { RefundRead } from "@/lib/payments/types";
import { globalSingleton } from "./global-store";

const payments = globalSingleton(
  "__eventupPayments",
  () => new Map<number, PaymentDetail>(),
);

function ensureSeed(): void {
  if (payments.size > 0) return;
  for (const p of buildFixturePayments()) {
    payments.set(p.id, p);
  }
}

export function resetPaymentsStore(): void {
  payments.clear();
  ensureSeed();
}

export function getPaymentById(id: number): PaymentDetail | null {
  ensureSeed();
  return payments.get(id) ?? null;
}

function toListItem(p: PaymentDetail): PaymentListItem {
  return {
    id: p.id,
    provider: p.provider,
    resource_type: p.resource_type,
    resource_id: p.resource_id,
    amount_minor: p.amount_minor,
    total_gross_minor: p.total_gross_minor,
    currency: p.currency,
    status: p.status,
    discount_amount_minor: p.discount_amount_minor,
    stripe_promotion_code: p.stripe_promotion_code,
    provider_name: p.provider_name,
    service_title: p.service_title,
    created_at: p.created_at,
  };
}

// Offset/limit listing mirroring the backend AdminPaymentFilter: status /
// currency / resource_type are exact-match filters, `q` is a case-insensitive
// substring over provider_name + service_title. Rows are ordered id DESC.
export function listPaymentsPage(query: PaymentListQuery): {
  items: PaymentListItem[];
  total: number;
} {
  ensureSeed();
  let rows = Array.from(payments.values()).sort((a, b) => b.id - a.id);

  if (query.status) rows = rows.filter((r) => r.status === query.status);
  if (query.currency) rows = rows.filter((r) => r.currency === query.currency);
  if (query.resource_type)
    rows = rows.filter((r) => r.resource_type === query.resource_type);
  if (query.q) {
    const needle = query.q.toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.provider_name ?? "").toLowerCase().includes(needle) ||
        (r.service_title ?? "").toLowerCase().includes(needle),
    );
  }

  const total = rows.length;
  const offset = Math.max(0, query.offset ?? 0);
  const limit = Math.max(1, Math.min(200, query.limit ?? 50));
  const items = rows.slice(offset, offset + limit).map(toListItem);
  return { items, total };
}

// M5 refund-write mock. Mirrors the backend rules: only succeeded /
// partially_refunded payments with refundable remaining accept a refund;
// omitted amount means "the full remainder"; reaching the charged total flips
// the payment to refunded, anything less to partially_refunded.
export function applyRefund(
  id: number,
  amountMinor: number | undefined,
  reason: string | undefined,
): { ok: true; refund: RefundRead } | { ok: false; status: number; message: string } {
  ensureSeed();
  const p = payments.get(id);
  if (!p) return { ok: false, status: 404, message: "Not found" };
  if (p.status !== "succeeded" && p.status !== "partially_refunded") {
    return {
      ok: false,
      status: 400,
      message: `Payment status '${p.status}' is not refundable`,
    };
  }
  const remaining = p.refundable_amount_minor;
  if (remaining <= 0)
    return { ok: false, status: 400, message: "No refundable amount remaining" };
  const amount = amountMinor ?? remaining;
  if (amount <= 0 || amount > remaining) {
    return {
      ok: false,
      status: 400,
      message: `Refund amount ${amount} exceeds refundable remaining ${remaining}`,
    };
  }
  const refund: RefundRead = {
    id: p.refunds.length + 1,
    payment_id: p.id,
    amount_minor: amount,
    currency: p.currency,
    status: "succeeded",
    reason: reason ?? null,
    stripe_refund_id: `re_mock_${p.id}_${p.refunds.length + 1}`,
    failure_code: null,
    failure_message: null,
    initiated_by_admin_id: null,
    created_at: new Date("2026-06-10T12:00:00.000Z").toISOString(),
  };
  const refunded = p.refunded_amount_minor + amount;
  const charged = p.total_gross_minor ?? p.amount_minor;
  payments.set(id, {
    ...p,
    refunds: [refund, ...p.refunds],
    refunded_amount_minor: refunded,
    refundable_amount_minor: Math.max(0, charged - refunded),
    status: refunded >= charged ? "refunded" : "partially_refunded",
  });
  return { ok: true, refund };
}
