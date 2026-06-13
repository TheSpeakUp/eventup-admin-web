import { formatDateTime, formatMoneyMinor } from "@/lib/format";
import type { PaymentDetail } from "@/lib/payments/types";
import PaymentStatusBadge from "../../_components/PaymentStatusBadge";

function Field({
  label,
  children,
  testid,
}: {
  label: string;
  children: React.ReactNode;
  testid?: string;
}) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-900" data-testid={testid}>
        {children}
      </dd>
    </div>
  );
}

export default function PaymentDetailView({
  payment,
}: {
  payment: PaymentDetail;
}) {
  return (
    <div className="space-y-5 rounded-md border border-zinc-200 bg-surface-1 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-xl font-semibold"
            data-testid="payment-detail-title"
          >
            Payment #{payment.id}
          </h1>
          <p className="text-sm text-zinc-500">
            {payment.service_title ??
              payment.provider_name ??
              `${payment.resource_type} #${payment.resource_id}`}
          </p>
        </div>
        <PaymentStatusBadge status={payment.status} />
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <Field label="Payment ID" testid="payment-field-id">
          <span className="font-mono text-xs">{payment.id}</span>
        </Field>
        <Field label="Provider gateway" testid="payment-field-provider">
          {payment.provider}
        </Field>
        <Field label="Resource" testid="payment-field-resource">
          <span className="font-mono text-xs">
            {payment.resource_type} #{payment.resource_id}
          </span>
        </Field>
        <Field label="Currency" testid="payment-field-currency">
          {payment.currency}
        </Field>
        <Field label="Amount" testid="payment-field-amount">
          {formatMoneyMinor(payment.amount_minor, payment.currency)}
        </Field>
        <Field label="Tax" testid="payment-field-tax">
          {formatMoneyMinor(payment.tax_amount_minor, payment.currency)}
        </Field>
        <Field label="Total gross" testid="payment-field-total-gross">
          {formatMoneyMinor(payment.total_gross_minor, payment.currency)}
        </Field>
        <Field label="Discount" testid="payment-field-discount">
          {formatMoneyMinor(payment.discount_amount_minor, payment.currency)}
        </Field>
        <Field label="Provider name" testid="payment-field-provider-name">
          {payment.provider_name ?? "—"}
        </Field>
        <Field label="Service title" testid="payment-field-service-title">
          {payment.service_title ?? "—"}
        </Field>
        <Field label="Created" testid="payment-field-created">
          {formatDateTime(payment.created_at)}
        </Field>
        <Field label="Updated" testid="payment-field-updated">
          {formatDateTime(payment.updated_at)}
        </Field>
      </dl>

      <div className="border-t border-zinc-100 pt-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Stripe references
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Field
            label="Checkout session"
            testid="payment-field-checkout-session"
          >
            <span className="break-all font-mono text-xs">
              {payment.stripe_checkout_session_id ?? "—"}
            </span>
          </Field>
          <Field label="Payment intent" testid="payment-field-payment-intent">
            <span className="break-all font-mono text-xs">
              {payment.stripe_payment_intent_id ?? "—"}
            </span>
          </Field>
          <Field label="Promotion code" testid="payment-field-promotion-code">
            {payment.stripe_promotion_code ?? "—"}
          </Field>
          <Field label="Coupon" testid="payment-field-coupon">
            {payment.stripe_coupon_id ?? "—"}
          </Field>
          <Field label="Receipt" testid="payment-field-receipt">
            {payment.receipt_url ? (
              <a
                href={payment.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-blue-600 hover:underline"
              >
                {payment.receipt_url}
              </a>
            ) : (
              "—"
            )}
          </Field>
        </dl>
      </div>

      {payment.failure_code || payment.failure_message ? (
        <div
          className="rounded-md bg-red-500/10 p-3 text-sm text-red-300"
          data-testid="payment-failure"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-red-300">
            Failure
          </p>
          {payment.failure_code ? (
            <p className="mt-1 font-mono text-xs">{payment.failure_code}</p>
          ) : null}
          {payment.failure_message ? (
            <p className="mt-1">{payment.failure_message}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
