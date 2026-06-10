import Link from "next/link";
import type { CategoryAttributeBindingRead } from "@/lib/categories/types";

export function BindingsTable({
  categoryId,
  rows,
}: {
  categoryId: number;
  rows: CategoryAttributeBindingRead[];
}) {
  if (rows.length === 0)
    return (
      <p data-testid="bindings-empty" className="p-4 text-gray-500">
        No attributes bound to this category yet.
      </p>
    );
  return (
    <table className="w-full text-sm" data-testid="bindings-table">
      <thead>
        <tr className="text-left text-gray-500">
          <th className="py-2">Attribute</th>
          <th>Group</th>
          <th>Sort</th>
          <th>In filters</th>
          <th>In card</th>
          <th>System</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.attribute_key}
            className="border-t"
            data-testid={`binding-row-${r.attribute_key}`}
          >
            <td className="py-2">{r.attribute_key}</td>
            <td>{r.group_name ?? "—"}</td>
            <td>{r.sort_order}</td>
            <td>{r.is_visible_in_filters ? "yes" : "no"}</td>
            <td>{r.is_visible_in_card ? "yes" : "no"}</td>
            <td>{r.is_system ? "yes" : "no"}</td>
            <td>
              <Link
                href={`/categories/${categoryId}/attributes/${encodeURIComponent(r.attribute_key)}`}
                data-testid={`binding-edit-${r.attribute_key}`}
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
