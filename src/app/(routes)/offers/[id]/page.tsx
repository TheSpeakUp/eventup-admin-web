import { notFound } from "next/navigation";
import { getOfferDetailCard } from "@/lib/offers/api";
import { isOfferStatus } from "@/lib/offers/types";
import OfferDetail from "./_components/OfferDetail";
import OfferModerationPanel from "./_components/OfferModerationPanel";

export default async function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offerId = Number(id);
  if (!Number.isFinite(offerId) || offerId <= 0) notFound();
  const result = await getOfferDetailCard(offerId);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <main className="space-y-3 p-6">
        <h1 className="text-xl font-semibold">Offer #{offerId}</h1>
        <p data-testid="offer-error" className="text-sm text-red-700">{result.message}</p>
      </main>
    );
  }
  const offer = result.data;
  if (!isOfferStatus(offer.status)) {
    return (
      <main className="space-y-3 p-6">
        <h1 className="text-xl font-semibold">Offer #{offerId}</h1>
        <p className="text-sm text-red-700">Unknown offer status: {offer.status}</p>
      </main>
    );
  }
  return (
    <main className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Offer #{offerId}</h1>
      <OfferDetail offer={offer} />
      <OfferModerationPanel offerId={offerId} status={offer.status} />
    </main>
  );
}
