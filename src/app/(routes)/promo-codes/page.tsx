// src/app/(routes)/promo-codes/page.tsx
import Link from "next/link";
import { listPromoCodes } from "@/lib/promo-codes/api";
import type { PromoCodeFilter } from "@/lib/promo-codes/types";
import PromoCodesTable from "./_components/PromoCodesTable";

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
        <h1 className="text-2xl font-semibold">Promo codes</h1>
        <div
          data-testid="promo-codes-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Promo codes</h1>
        <Link
          href="/promo-codes/new"
          data-testid="promo-new"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          New promo code
        </Link>
      </div>

      <form className="mt-4 flex gap-2" data-testid="promo-codes-search">
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

      <div className="mt-4">
        <PromoCodesTable rows={rows} />
      </div>
    </div>
  );
}
