// src/app/(routes)/categories/_components/CategoriesTable.tsx
import Link from "next/link";
import type { CategoryRead } from "@/lib/categories/types";
import EmptyState from "@/app/_components/ui/EmptyState";
import { Table, THead, TBody, Tr, Th, Td } from "@/app/_components/ui/Table";

export function CategoriesTable({
  rows,
  parentNames,
}: {
  rows: CategoryRead[];
  parentNames: Map<number, string>;
}) {
  if (rows.length === 0)
    return <EmptyState testid="categories-empty">No categories yet.</EmptyState>;
  return (
    <div data-testid="categories-table">
    <Table>
      <THead>
        <Tr>
          <Th>Name</Th>
          <Th>Slug</Th>
          <Th>Parent</Th>
          <Th>Sort</Th>
          <Th>Leaf</Th>
          <Th />
        </Tr>
      </THead>
      <TBody>
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
      </TBody>
    </Table>
    </div>
  );
}
