// src/app/(routes)/promotions/page.tsx
//
// Tabbed promotions CATALOG (M3a). Tab selection rides the ?tab= searchParam
// (server component; PromotionsTabs links flip it). Only the active tab's list
// is fetched per render. A 403 from any list surfaces the same "requires an
// admin role" panel as categories.
import {
  listCampaigns,
  listDiscountRules,
  listMonthlyDiscounts,
  listOrders,
  listProducts,
  listTariffs,
  listZones,
} from "@/lib/promotions/api";
import {
  isPromotionsTab,
  type PromotionsTab,
} from "@/lib/promotions/types";
import PromotionsTabs from "./_components/PromotionsTabs";
import ExportCsvButton from "@/app/_components/ExportCsvButton";
import PageHeader from "@/app/_components/ui/PageHeader";
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
import OrdersTable from "./_components/OrdersTable";
import CampaignsTable from "./_components/CampaignsTable";
import OrdersFilter from "./_components/OrdersFilter";
import CampaignsFilter from "./_components/CampaignsFilter";

function ErrorPanel({ message, status }: { message: string; status: number }) {
  return (
    <div
      data-testid="promotions-error"
      className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-red-300"
    >
      {status === 403
        ? "Viewing promotions requires an admin role."
        : `Failed to load promotions: ${message}`}
    </div>
  );
}

type Filters = { status?: string; service_id?: number };

async function TabContent({
  tab,
  filters,
}: {
  tab: PromotionsTab;
  filters: Filters;
}) {
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
  if (tab === "zones") {
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
  if (tab === "orders") {
    const res = await listOrders({
      limit: 200,
      status: filters.status,
      service_id: filters.service_id,
    });
    if (!res.ok) return <ErrorPanel message={res.message} status={res.status} />;
    return (
      <div className="mt-4 space-y-4">
        <OrdersFilter status={filters.status} serviceId={filters.service_id} />
        <OrdersTable rows={res.data.items} />
      </div>
    );
  }
  // campaigns
  const res = await listCampaigns({
    limit: 200,
    status: filters.status,
    service_id: filters.service_id,
  });
  if (!res.ok) return <ErrorPanel message={res.message} status={res.status} />;
  return (
    <div className="mt-4 space-y-4">
      <CampaignsFilter status={filters.status} serviceId={filters.service_id} />
      <CampaignsTable rows={res.data.items} />
    </div>
  );
}

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    status?: string;
    service_id?: string;
  }>;
}) {
  const sp = await searchParams;
  const tab: PromotionsTab =
    sp.tab && isPromotionsTab(sp.tab) ? sp.tab : "products";
  const serviceIdNum =
    sp.service_id && Number.isFinite(Number(sp.service_id))
      ? Number(sp.service_id)
      : undefined;
  const filters: Filters = {
    status: sp.status || undefined,
    service_id: serviceIdNum,
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Promotions"
        actions={
          tab === "orders" || tab === "campaigns" ? (
            <ExportCsvButton
              surface={tab === "orders" ? "promotion-orders" : "promotion-campaigns"}
              params={{
                status: filters.status,
                service_id:
                  filters.service_id !== undefined
                    ? String(filters.service_id)
                    : undefined,
              }}
            />
          ) : null
        }
      />
      <div className="mt-4">
        <PromotionsTabs active={tab} />
      </div>
      <TabContent tab={tab} filters={filters} />
    </div>
  );
}
