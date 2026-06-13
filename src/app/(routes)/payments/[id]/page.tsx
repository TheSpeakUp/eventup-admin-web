import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayment } from "@/lib/payments/api";
import { Panel } from "@/app/_components/ui";
import PaymentDetailView from "./_components/PaymentDetailView";
import RefundPanel from "./_components/RefundPanel";

type Params = Promise<{ id: string }>;

// Payment detail (M5) + refund action panel (M5 refund-write): full or
// partial Stripe refund, SUPERADMIN-gated on the backend.
export default async function PaymentDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum <= 0) notFound();
  const result = await getPayment(idNum);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <div className="p-8">
        <Link
          href="/payments"
          className="text-sm text-ink-subtle hover:underline"
        >
          ← Back to payments
        </Link>
        <div
          data-testid="payment-detail-error"
          className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {result.status === 403
            ? "Viewing payments requires an admin role."
            : `Failed to load payment: ${result.message}`}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-5">
      <Link href="/payments" className="text-sm text-ink-subtle hover:underline">
        ← Back to payments
      </Link>
      <Panel title="Payment details" accent="info">
        <PaymentDetailView payment={result.data} />
      </Panel>
      <Panel title="Refund" accent="warning">
        <RefundPanel
          paymentId={result.data.id}
          currency={result.data.currency}
          refundableAmountMinor={result.data.refundable_amount_minor}
          refundedAmountMinor={result.data.refunded_amount_minor}
          refunds={result.data.refunds}
        />
      </Panel>
    </div>
  );
}
