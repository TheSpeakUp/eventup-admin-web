import type {
  PaymentDetail,
  PaymentListItem,
  PaymentListQuery,
} from "@/lib/payments/types";
import { buildFixturePayments } from "./payments-fixtures";

const payments = new Map<number, PaymentDetail>();

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
