import { formatMoneyMinor } from "@/lib/format";
import type { TopsResponse } from "@/lib/dashboard/types";
import BarList, { type BarListItem } from "./BarList";

function Panel({
  title,
  items,
  emptyMessage,
  testid,
}: {
  title: string;
  items: BarListItem[];
  emptyMessage: string;
  testid: string;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-1 p-4">
      <h3 className="mb-3 text-sm font-medium text-ink">{title}</h3>
      <BarList items={items} emptyMessage={emptyMessage} testid={testid} />
    </div>
  );
}

export default function TopsSection({ data }: { data: TopsResponse }) {
  if (!data) {
    return <div className="text-sm text-ink-subtle">No top performers data</div>;
  }

  const { providers, services, promo_discounts } = data;

  const providerItems: BarListItem[] = (providers || []).map((p) => ({
    label: p.provider_name || `Provider #${p.provider_id}`,
    value: p.gross_minor,
    valueLabel: `${formatMoneyMinor(p.gross_minor, p.currency)} · ${p.payment_count}`,
  }));

  const serviceItems: BarListItem[] = (services || []).map((s) => ({
    label: s.service_title || `Service #${s.service_id}`,
    sublabel: s.provider_name || undefined,
    value: s.gross_minor,
    valueLabel: `${formatMoneyMinor(s.gross_minor, s.currency)} · ${s.payment_count}`,
  }));

  const promoItems: BarListItem[] = (promo_discounts || []).map((p) => ({
    label: p.currency || "—",
    value: p.discount_minor,
    valueLabel: `${formatMoneyMinor(p.discount_minor, p.currency)} · ${p.usage_count}`,
  }));

  return (
    <div data-testid="tops-section" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Panel
        title="Top providers"
        items={providerItems}
        emptyMessage="No provider data available"
        testid="tops-providers-table"
      />
      <Panel
        title="Top services"
        items={serviceItems}
        emptyMessage="No service data available"
        testid="tops-services-table"
      />
      <Panel
        title="Promo discounts"
        items={promoItems}
        emptyMessage="No promo discount data available"
        testid="tops-promos-table"
      />
    </div>
  );
}
