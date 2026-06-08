import type { OfferDetailCard } from "@/lib/offers/types";
import OfferStatusBadge from "./OfferStatusBadge";
import QueueStatusBadge from "../../_components/QueueStatusBadge";

function formatMoney(minor: number | null, currency: string | null): string {
  if (minor == null || !currency) return "—";
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

export default function OfferDetail({ offer }: { offer: OfferDetailCard }) {
  return (
    <section data-testid="offer-detail" className="space-y-3 rounded-md border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <OfferStatusBadge status={offer.status} />
        <QueueStatusBadge status={offer.queue_status} />
        <span className="text-sm text-zinc-600">waiting {offer.waiting_hours.toFixed(1)}h</span>
      </div>
      <h2 className="text-lg font-semibold text-zinc-900">{offer.offer_title ?? `Offer #${offer.offer_id}`}</h2>
      {offer.offer_description ? <p className="text-sm text-zinc-700">{offer.offer_description}</p> : null}
      <dl className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
        <Row label="Service" value={offer.service_title ? `${offer.service_title} (#${offer.service_id})` : `#${offer.service_id}`} />
        <Row label="Provider" value={offer.provider_name ?? (offer.provider_id ? `#${offer.provider_id}` : "—")} />
        <Row label="Code" value={offer.code ?? "—"} />
        <Row label="Kind" value={offer.kind ?? "—"} />
        <Row label="Percent" value={offer.percent_value != null ? `${offer.percent_value}%` : "—"} />
        <Row label="Fixed" value={formatMoney(offer.fixed_value_minor, offer.currency)} />
        <Row label="Permanent" value={offer.is_permanent ? "yes" : "no"} />
        <Row label="Created at" value={offer.created_at} />
        <Row label="Start at" value={offer.start_at ?? "—"} />
        <Row label="Deadline" value={offer.deadline ?? "—"} />
        <Row label="Link" value={offer.link ?? "—"} />
      </dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-zinc-100 py-1 sm:border-b-0">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-900">{value}</dd>
    </div>
  );
}
