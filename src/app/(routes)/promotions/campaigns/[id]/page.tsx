// src/app/(routes)/promotions/campaigns/[id]/page.tsx
//
// Campaign detail — exercises GET /promotions/campaigns/{id}. Read-only; the
// cancel action lives in the list row. A 404 renders an actionable not-found
// panel (same idiom as the product/order detail routes).
import Link from "next/link";
import { getCampaign } from "@/lib/promotions/api";
import StatusPill from "../../_components/StatusPill";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getCampaign(Number(id));

  if (!res.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Promotion campaign</h1>
        <div
          data-testid="campaign-detail-error"
          className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-red-300"
        >
          {res.status === 404
            ? `No promotion campaign with id ${id}.`
            : res.status === 403
              ? "Viewing promotions requires an admin role."
              : `Failed to load campaign: ${res.message}`}
        </div>
        <Link
          href="/promotions?tab=campaigns"
          className="mt-4 inline-block text-sm text-primary-hover"
        >
          ← Back to campaigns
        </Link>
      </div>
    );
  }

  const c = res.data;
  return (
    <div className="p-8">
      <div className="flex items-center gap-3">
        <h1
          className="text-2xl font-semibold"
          data-testid="campaign-detail-id"
        >
          Campaign #{c.id}
        </h1>
        <StatusPill status={c.status} />
      </div>
      <dl className="mt-4 max-w-xl space-y-2 text-sm text-zinc-700">
        <div className="flex gap-2">
          <dt className="w-40 text-zinc-500">Service</dt>
          <dd data-testid="campaign-service-label">
            {c.service_title ?? `#${c.service_id}`}
            {c.service_title ? (
              <span className="ml-1 text-zinc-400">#{c.service_id}</span>
            ) : null}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 text-zinc-500">Product</dt>
          <dd data-testid="campaign-product-label">
            {c.product_code ?? `#${c.product_id}`}
            {c.product_code ? (
              <span className="ml-1 text-zinc-400">#{c.product_id}</span>
            ) : null}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 text-zinc-500">Zone</dt>
          <dd data-testid="campaign-zone-label">
            {c.zone_id === null ? "—" : (c.zone_code ?? `#${c.zone_id}`)}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 text-zinc-500">Order item id</dt>
          <dd>{c.order_item_id}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 text-zinc-500">Window</dt>
          <dd>
            {c.start_date} → {c.end_date} ({c.time_unit})
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 text-zinc-500">Slots reserved</dt>
          <dd>{c.slots_reserved}</dd>
        </div>
      </dl>
      <Link
        href="/promotions?tab=campaigns"
        className="mt-6 inline-block text-sm text-primary-hover"
      >
        ← Back to campaigns
      </Link>
    </div>
  );
}
