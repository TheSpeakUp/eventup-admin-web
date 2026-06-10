// src/app/(routes)/promotions/page.tsx
//
// Tabbed promotions CATALOG (M3a). Tab selection rides the ?tab= searchParam
// (server component; PromotionsTabs links flip it). Only the active tab's list
// is fetched per render. A 403 from any list surfaces the same "requires an
// admin role" panel as categories.
import {
  listDiscountRules,
  listMonthlyDiscounts,
  listProducts,
  listTariffs,
  listZones,
} from "@/lib/promotions/api";
import {
  isPromotionsTab,
  type PromotionsTab,
} from "@/lib/promotions/types";
import PromotionsTabs from "./_components/PromotionsTabs";
import NewItemPanel from "./_components/NewItemPanel";
import ProductsTable from "./_components/ProductsTable";
import ProductForm from "./_components/ProductForm";
import TariffsTable from "./_components/TariffsTable";
import TariffForm from "./_components/TariffForm";
import DiscountRulesTable from "./_components/DiscountRulesTable";
import DiscountRuleForm from "./_components/DiscountRuleForm";
import MonthlyDiscountsTable from "./_components/MonthlyDiscountsTable";
import MonthlyDiscountForm from "./_components/MonthlyDiscountForm";
import ZonesTable from "./_components/ZonesTable";
import ZoneForm from "./_components/ZoneForm";

function ErrorPanel({ message, status }: { message: string; status: number }) {
  return (
    <div
      data-testid="promotions-error"
      className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
    >
      {status === 403
        ? "Viewing promotions requires an admin role."
        : `Failed to load promotions: ${message}`}
    </div>
  );
}

async function TabContent({ tab }: { tab: PromotionsTab }) {
  if (tab === "products") {
    const res = await listProducts({ limit: 200 });
    if (!res.ok) return <ErrorPanel message={res.message} status={res.status} />;
    return (
      <div className="mt-4 space-y-4">
        <NewItemPanel label="New product" testid="product-new">
          <ProductForm mode="create" />
        </NewItemPanel>
        <ProductsTable rows={res.data.items} />
      </div>
    );
  }
  if (tab === "tariffs") {
    const res = await listTariffs({ limit: 200 });
    if (!res.ok) return <ErrorPanel message={res.message} status={res.status} />;
    return (
      <div className="mt-4 space-y-4">
        <NewItemPanel label="New tariff" testid="tariff-new">
          <TariffForm mode="create" />
        </NewItemPanel>
        <TariffsTable rows={res.data.items} />
      </div>
    );
  }
  if (tab === "discount-rules") {
    const res = await listDiscountRules({ limit: 200 });
    if (!res.ok) return <ErrorPanel message={res.message} status={res.status} />;
    return (
      <div className="mt-4 space-y-4">
        <NewItemPanel label="New discount rule" testid="discount-rule-new">
          <DiscountRuleForm mode="create" />
        </NewItemPanel>
        <DiscountRulesTable rows={res.data.items} />
      </div>
    );
  }
  if (tab === "monthly-discounts") {
    const res = await listMonthlyDiscounts({ limit: 200 });
    if (!res.ok) return <ErrorPanel message={res.message} status={res.status} />;
    return (
      <div className="mt-4 space-y-4">
        <NewItemPanel
          label="New monthly discount"
          testid="monthly-discount-new"
        >
          <MonthlyDiscountForm mode="create" />
        </NewItemPanel>
        <MonthlyDiscountsTable rows={res.data.items} />
      </div>
    );
  }
  // zones
  const res = await listZones({ limit: 200 });
  if (!res.ok) return <ErrorPanel message={res.message} status={res.status} />;
  return (
    <div className="mt-4 space-y-4">
      <NewItemPanel label="New zone" testid="zone-new">
        <ZoneForm mode="create" />
      </NewItemPanel>
      <ZonesTable rows={res.data.items} />
    </div>
  );
}

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab: PromotionsTab =
    sp.tab && isPromotionsTab(sp.tab) ? sp.tab : "products";

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Promotions</h1>
      <div className="mt-4">
        <PromotionsTabs active={tab} />
      </div>
      <TabContent tab={tab} />
    </div>
  );
}
