// src/app/(routes)/categories/page.tsx
import Link from "next/link";
import { listCategories } from "@/lib/categories/api";
import { isCategorySort } from "@/lib/categories/types";
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
        <h1 className="text-2xl font-semibold">Categories</h1>
        <div
          data-testid="categories-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {result.status === 403
            ? "Viewing categories requires an admin role."
            : `Failed to load categories: ${result.message}`}
        </div>
      </div>
    );
  }

  const rows = result.data.items;
  const parentNames = new Map(rows.map((r) => [r.id, r.name]));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <Link
          href="/categories/new"
          data-testid="category-new"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          New category
        </Link>
      </div>

      <form className="mt-4 flex gap-2" data-testid="categories-search">
        <input
          name="search"
          placeholder="Search name or slug"
          defaultValue={sp.search ?? ""}
          className="rounded border px-2 py-1"
        />
        <select
          name="sort"
          defaultValue={sort}
          className="rounded border px-2 py-1"
        >
          <option value="sort_order_asc">Sort ↑</option>
          <option value="sort_order_desc">Sort ↓</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
        </select>
        <button type="submit" className="rounded border px-3 py-1">
          Apply
        </button>
      </form>

      <div className="mt-4">
        <CategoriesTable rows={rows} parentNames={parentNames} />
      </div>
    </div>
  );
}
