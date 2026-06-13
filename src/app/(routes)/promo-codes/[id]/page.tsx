// src/app/(routes)/promo-codes/[id]/page.tsx
import { notFound } from "next/navigation";
import { getPromoCode } from "@/lib/promo-codes/api";
import { formatDateTime } from "@/lib/format";
import {
  targetingCounts,
  targetingSummary,
} from "@/lib/promo-codes/types";
import PromoCodeForm from "../_components/PromoCodeForm";
import PromoStatusBadge from "../_components/PromoStatusBadge";
import DeactivatePromoCodeButton from "../_components/DeactivatePromoCodeButton";

export default async function PromoCodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId < 1) notFound();

  const res = await getPromoCode(numId);
  if (res.status === 404) notFound();
  if (!res.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Promo code</h1>
        <div
          data-testid="promo-detail-error"
          className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-red-300"
        >
          {`Failed to load promo code: ${res.message}`}
        </div>
      </div>
    );
  }

  const p = res.data;
  const counts = targetingCounts(p.targeting_rules);

  // Key-remount so revalidated server values reset the uncontrolled form
  // (React 19 <form action> reset gotcha — mirrors the categories detail page).
  const formKey = `${p.id}:${p.is_active}:${p.valid_until}:${p.max_uses}`;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" data-testid="promo-detail-code">
          {p.code}
        </h1>
        <PromoStatusBadge isActive={p.is_active} />
      </div>

      <div className="mt-4 max-w-2xl space-y-6">
        <section
          data-testid="promo-detail-summary"
          className="rounded border border-zinc-200 p-4 text-sm"
        >
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <dt className="text-zinc-500">Discount</dt>
              <dd>
                {p.discount_type === "percent"
                  ? `${p.discount_value}%`
                  : `${p.discount_value} ${p.currency ?? ""}`.trim()}{" "}
                ({p.discount_type})
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Usage</dt>
              <dd>
                {p.used_count} / {p.max_uses != null ? p.max_uses : "∞"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Valid from</dt>
              <dd>{formatDateTime(p.valid_from)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Valid until</dt>
              <dd>{formatDateTime(p.valid_until)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Min order (minor)</dt>
              <dd>{p.min_order_amount_minor ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Stripe coupon</dt>
              <dd>{p.stripe_coupon_id ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Created</dt>
              <dd>{formatDateTime(p.created_at)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Item types</dt>
              <dd>
                {p.allowed_item_types && p.allowed_item_types.length > 0
                  ? p.allowed_item_types.join(", ")
                  : "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-4 border-t border-zinc-200 pt-3">
            <dt className="text-zinc-500">Targeting</dt>
            <dd data-testid="promo-detail-targeting">
              {targetingSummary(p.targeting_rules)}
            </dd>
            <ul className="mt-1 text-xs text-zinc-500">
              <li data-testid="promo-detail-target-providers">
                Providers: {counts.provider}
              </li>
              <li data-testid="promo-detail-target-categories">
                Categories: {counts.category}
              </li>
              <li data-testid="promo-detail-target-locations">
                Locations: {counts.location}
              </li>
            </ul>
          </div>
        </section>

        {p.is_active ? <DeactivatePromoCodeButton id={p.id} /> : null}

        <section className="space-y-2">
          <h2 className="text-lg font-medium">Edit mutable fields</h2>
          <PromoCodeForm key={formKey} mode="edit" promoCode={p} />
        </section>
      </div>
    </div>
  );
}
