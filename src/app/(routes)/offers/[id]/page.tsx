import { notFound } from "next/navigation";
import { getOfferDetailCard } from "@/lib/offers/api";
import { isOfferStatus } from "@/lib/offers/types";
import OfferDetail from "./_components/OfferDetail";
import OfferModerationPanel from "./_components/OfferModerationPanel";
import PageHeader from "@/app/_components/ui/PageHeader";
import Alert from "@/app/_components/ui/Alert";

export default async function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offerId = Number(id);
  if (!Number.isFinite(offerId) || offerId <= 0) notFound();
  const result = await getOfferDetailCard(offerId);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <main className="space-y-4 p-8">
        <PageHeader title={`Offer #${offerId}`} />
        <div data-testid="offer-error">
          <Alert tone="danger">{result.message}</Alert>
        </div>
      </main>
    );
  }
  const offer = result.data;
  if (!isOfferStatus(offer.status)) {
    return (
      <main className="space-y-4 p-8">
        <PageHeader title={`Offer #${offerId}`} />
        <Alert tone="danger">Unknown offer status: {offer.status}</Alert>
      </main>
    );
  }
  return (
    <main className="space-y-4 p-8">
      <PageHeader title={`Offer #${offerId}`} />
      <OfferDetail offer={offer} />
      <OfferModerationPanel offerId={offerId} status={offer.status} />
    </main>
  );
}
