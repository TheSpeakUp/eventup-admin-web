import Link from "next/link";
import type { AttributeDefinitionRead } from "@/lib/attribute-definitions/types";

export function AttributeDefinitionsTable({
  rows,
}: {
  rows: AttributeDefinitionRead[];
}) {
  if (rows.length === 0)
    return (
      <p data-testid="attribute-definitions-empty" className="p-4 text-gray-500">
        No attribute definitions yet.
      </p>
    );
  return (
    <table
      className="w-full text-sm"
      data-testid="attribute-definitions-table"
    >
      <thead>
        <tr className="text-left text-gray-500">
          <th className="py-2">Key</th>
          <th>Group</th>
          <th>Sort</th>
          <th>Active</th>
          <th>System</th>
          <th>Bindings</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.key}
            className="border-t"
            data-testid={`attribute-definition-row-${r.key}`}
          >
            <td className="py-2">{r.key}</td>
            <td>{r.group_name ?? "—"}</td>
            <td>{r.sort_order}</td>
            <td>{r.is_active ? "yes" : "no"}</td>
            <td>{r.is_system ? "yes" : "no"}</td>
            <td>{r.bindings_count}</td>
            <td>
              <Link
                href={`/attribute-definitions/${encodeURIComponent(r.key)}`}
                data-testid={`attribute-definition-edit-${r.key}`}
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
