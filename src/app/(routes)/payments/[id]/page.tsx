import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayment } from "@/lib/payments/api";
import PaymentDetailView from "./_components/PaymentDetailView";

type Params = Promise<{ id: string }>;

// Read-only payment detail (M5). Refund / mutation path is deliberately NOT
// built — deferred (Stripe + money). This page renders fields only; there is
// no action panel.
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
          className="text-sm text-zinc-500 hover:underline"
        >
          ← Back to payments
        </Link>
        <div
          data-testid="payment-detail-error"
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
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
      <Link href="/payments" className="text-sm text-zinc-500 hover:underline">
        ← Back to payments
      </Link>
      <PaymentDetailView payment={result.data} />
    </div>
  );
}
