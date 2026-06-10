// src/app/(routes)/promotions/_components/PromotionsTabs.tsx
// Tab switcher — links flip the ?tab= searchParam (same idiom as the traffic
// type-switch). Server component; the page re-renders for the active tab.
import Link from "next/link";
import { PROMOTIONS_TABS, type PromotionsTab } from "@/lib/promotions/types";

const LABELS: Record<PromotionsTab, string> = {
  products: "Products",
  tariffs: "Tariffs",
  "discount-rules": "Discount rules",
  "monthly-discounts": "Monthly discounts",
  zones: "Zones",
  orders: "Orders",
  campaigns: "Campaigns",
};

export default function PromotionsTabs({ active }: { active: PromotionsTab }) {
  return (
    <div
      className="inline-flex flex-wrap gap-0.5 rounded border border-zinc-200 bg-white p-0.5 text-sm"
      data-testid="promotions-tabs"
    >
      {PROMOTIONS_TABS.map((tab) => (
        <Link
          key={tab}
          href={`/promotions?tab=${tab}`}
          data-testid={`promotions-tab-${tab}`}
          data-active={tab === active}
          className={`rounded px-3 py-1 ${
            tab === active
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          {LABELS[tab]}
        </Link>
      ))}
    </div>
  );
}
