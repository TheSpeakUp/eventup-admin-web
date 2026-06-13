// src/app/(routes)/promo-codes/page.tsx
import Link from "next/link";
import { listPromoCodes } from "@/lib/promo-codes/api";
import type { PromoCodeFilter } from "@/lib/promo-codes/types";
import Alert from "@/app/_components/ui/Alert";
import Button from "@/app/_components/ui/Button";
import PageHeader from "@/app/_components/ui/PageHeader";
import { FormField, Input, Select } from "@/app/_components/ui/FormField";
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
        <PageHeader title="Promo codes" />
        <div data-testid="promo-codes-error" className="mt-4">
          <Alert tone="danger">
            {result.status === 403
              ? "Viewing promo codes requires an admin role."
              : `Failed to load promo codes: ${result.message}`}
          </Alert>
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
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus"
          >
            New promo code
          </Link>
        }
      />

      <form className="mt-4 flex flex-wrap items-end gap-2" data-testid="promo-codes-search">
        <FormField label="Code" htmlFor="promo-codes-search-code">
          <Input
            id="promo-codes-search-code"
            name="code"
            placeholder="Search by code"
            defaultValue={sp.code ?? ""}
          />
        </FormField>
        <FormField label="Status" htmlFor="promo-status-filter">
          <Select
            id="promo-status-filter"
            name="status"
            defaultValue={sp.status ?? ""}
            data-testid="promo-status-filter"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FormField>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>

      <div className="mt-4">
        <PromoCodesTable rows={rows} />
      </div>
    </div>
  );
}
