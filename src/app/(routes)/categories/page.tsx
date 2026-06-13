// src/app/(routes)/categories/page.tsx
import Link from "next/link";
import { listCategories } from "@/lib/categories/api";
import { isCategorySort } from "@/lib/categories/types";
import Alert from "@/app/_components/ui/Alert";
import PageHeader from "@/app/_components/ui/PageHeader";
import Button, { buttonClass } from "@/app/_components/ui/Button";
import { Input, Select } from "@/app/_components/ui/Field";
import { Panel } from "@/app/_components/ui";
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
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Categories
        </h1>
        <Alert variant="danger" data-testid="categories-error" className="mt-4">
          {result.status === 403
            ? "Viewing categories requires an admin role."
            : `Failed to load categories: ${result.message}`}
        </Alert>
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
            className={buttonClass("primary")}
          >
            New category
          </Link>
        }
      />

      <Panel title="Categories" accent="primary" bodyClassName="p-0" className="mt-5">
        <form className="flex gap-2 px-4 py-3 border-b border-hairline" data-testid="categories-search">
          <Input
            name="search"
            placeholder="Search name or slug"
            defaultValue={sp.search ?? ""}
            className="mt-0 max-w-xs"
          />
          <Select name="sort" defaultValue={sort} className="mt-0 w-auto">
            <option value="sort_order_asc">Sort ↑</option>
            <option value="sort_order_desc">Sort ↓</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
          </Select>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
        <CategoriesTable rows={rows} parentNames={parentNames} />
      </Panel>
    </div>
  );
}
