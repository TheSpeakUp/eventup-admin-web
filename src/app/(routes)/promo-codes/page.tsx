// src/app/(routes)/promo-codes/page.tsx
import Link from "next/link";
import { listPromoCodes } from "@/lib/promo-codes/api";
import type { PromoCodeFilter } from "@/lib/promo-codes/types";
import PromoCodesTable from "./_components/PromoCodesTable";
import PageHeader from "@/app/_components/ui/PageHeader";
import { buttonClass } from "@/app/_components/ui/Button";
import { Panel } from "@/app/_components/ui";

export default async function PromoCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const filter: PromoCodeFilter = { limit: 100 };
  if (sp.code) filter.code = sp.code;
  if (sp.status === "active") filter.is_active = true;
  if (sp.status === "inactive") filter.is_active = false;

  const result = await listPromoCodes(filter);

  if (!result.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Promo codes
        </h1>
        <div
          data-testid="promo-codes-error"
          className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-red-300"
        >
          {result.status === 403
            ? "Viewing promo codes requires an admin role."
            : `Failed to load promo codes: ${result.message}`}
        </div>
      </div>
    );
  }

  const rows = result.data.items;

  return (
    <div className="p-8">
      <PageHeader
        title="Promo codes"
        actions={
          <Link
            href="/promo-codes/new"
            data-testid="promo-new"
            className={buttonClass("primary")}
          >
            New promo code
          </Link>
        }
      />

      <Panel title="Promo codes" accent="primary" bodyClassName="p-0" className="mt-4">
        <form className="flex gap-2 px-4 py-3 border-b border-hairline" data-testid="promo-codes-search">
          <input
            name="code"
            placeholder="Search by code"
            defaultValue={sp.code ?? ""}
            className="rounded border px-2 py-1"
          />
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            data-testid="promo-status-filter"
            className="rounded border px-2 py-1"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit" className="rounded border px-3 py-1">
            Apply
          </button>
        </form>
        <PromoCodesTable rows={rows} />
      </Panel>
    </div>
  );
}
