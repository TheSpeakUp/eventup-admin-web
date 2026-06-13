// src/app/(routes)/categories/page.tsx
import Link from "next/link";
import { listCategories } from "@/lib/categories/api";
import { isCategorySort } from "@/lib/categories/types";
import Alert from "@/app/_components/ui/Alert";
import Button from "@/app/_components/ui/Button";
import PageHeader from "@/app/_components/ui/PageHeader";
import { FormField, Input, Select } from "@/app/_components/ui/FormField";
import { CategoriesTable } from "./_components/CategoriesTable";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const sort = sp.sort && isCategorySort(sp.sort) ? sp.sort : "sort_order_asc";
  const result = await listCategories({ search: sp.search, sort, limit: 100 });

  if (!result.ok) {
    return (
      <div className="p-8">
        <PageHeader title="Categories" />
        <div data-testid="categories-error" className="mt-4">
          <Alert tone="danger">
            {result.status === 403
              ? "Viewing categories requires an admin role."
              : `Failed to load categories: ${result.message}`}
          </Alert>
        </div>
      </div>
    );
  }

  const rows = result.data.items;
  const parentNames = new Map(rows.map((r) => [r.id, r.name]));

  return (
    <div className="p-8">
      <PageHeader
        title="Categories"
        actions={
          <Link
            href="/categories/new"
            data-testid="category-new"
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus"
          >
            New category
          </Link>
        }
      />

      <form className="mt-4 flex flex-wrap items-end gap-2" data-testid="categories-search">
        <FormField label="Search" htmlFor="categories-search-input">
          <Input
            id="categories-search-input"
            name="search"
            placeholder="Search name or slug"
            defaultValue={sp.search ?? ""}
          />
        </FormField>
        <FormField label="Sort" htmlFor="categories-sort">
          <Select id="categories-sort" name="sort" defaultValue={sort}>
            <option value="sort_order_asc">Sort ↑</option>
            <option value="sort_order_desc">Sort ↓</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
          </Select>
        </FormField>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>

      <div className="mt-4">
        <CategoriesTable rows={rows} parentNames={parentNames} />
      </div>
    </div>
  );
}
