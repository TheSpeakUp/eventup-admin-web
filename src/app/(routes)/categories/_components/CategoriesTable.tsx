// src/app/(routes)/categories/_components/CategoriesTable.tsx
import Link from "next/link";
import EmptyState from "@/app/_components/ui/EmptyState";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";
import type { CategoryRead } from "@/lib/categories/types";

export function CategoriesTable({
  rows,
  parentNames,
}: {
  rows: CategoryRead[];
  parentNames: Map<number, string>;
}) {
  if (rows.length === 0)
    return <EmptyState data-testid="categories-empty">No categories yet.</EmptyState>;
  return (
    <Table data-testid="categories-table">
      <Thead>
        <tr>
          <Th>Name</Th>
          <Th>Slug</Th>
          <Th>Parent</Th>
          <Th>Sort</Th>
          <Th>Leaf</Th>
          <Th />
        </tr>
      </Thead>
      <Tbody>
        {rows.map((r) => (
          <Tr key={r.id} data-testid={`category-row-${r.id}`}>
            <Td>{r.name}</Td>
            <Td>{r.slug}</Td>
            <Td>
              {r.parent_id != null
                ? (parentNames.get(r.parent_id) ?? "—")
                : "—"}
            </Td>
            <Td>{r.sort_order}</Td>
            <Td>{r.is_leaf ? "yes" : "no"}</Td>
            <Td>
              <Link
                href={`/categories/${r.id}`}
                data-testid={`category-edit-${r.id}`}
                className="text-primary-hover hover:underline"
              >
                Edit
              </Link>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
