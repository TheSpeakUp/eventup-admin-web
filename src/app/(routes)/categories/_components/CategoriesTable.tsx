// src/app/(routes)/categories/_components/CategoriesTable.tsx
import Link from "next/link";
import type { CategoryRead } from "@/lib/categories/types";

export function CategoriesTable({
  rows,
  parentNames,
}: {
  rows: CategoryRead[];
  parentNames: Map<number, string>;
}) {
  if (rows.length === 0)
    return (
      <p data-testid="categories-empty" className="p-4 text-gray-500">
        No categories yet.
      </p>
    );
  return (
    <table className="w-full text-sm" data-testid="categories-table">
      <thead>
        <tr className="text-left text-gray-500">
          <th className="py-2">Name</th>
          <th>Slug</th>
          <th>Parent</th>
          <th>Sort</th>
          <th>Leaf</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.id}
            className="border-t"
            data-testid={`category-row-${r.id}`}
          >
            <td className="py-2">{r.name}</td>
            <td>{r.slug}</td>
            <td>
              {r.parent_id != null
                ? (parentNames.get(r.parent_id) ?? r.parent_id)
                : "—"}
            </td>
            <td>{r.sort_order}</td>
            <td>{r.is_leaf ? "yes" : "no"}</td>
            <td>
              <Link
                href={`/categories/${r.id}`}
                data-testid={`category-edit-${r.id}`}
                className="text-blue-700"
              >
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
