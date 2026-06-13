import Link from "next/link";
import EmptyState from "@/app/_components/ui/EmptyState";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";
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
      <EmptyState data-testid="bindings-empty">
        No attributes bound to this category yet.
      </EmptyState>
    );
  return (
    <Table data-testid="bindings-table">
      <Thead>
        <tr>
          <Th>Attribute</Th>
          <Th>Group</Th>
          <Th>Sort</Th>
          <Th>In filters</Th>
          <Th>In card</Th>
          <Th>System</Th>
          <Th />
        </tr>
      </Thead>
      <Tbody>
        {rows.map((r) => (
          <Tr key={r.attribute_key} data-testid={`binding-row-${r.attribute_key}`}>
            <Td>{r.attribute_key}</Td>
            <Td>{r.group_name ?? "—"}</Td>
            <Td>{r.sort_order}</Td>
            <Td>{r.is_visible_in_filters ? "yes" : "no"}</Td>
            <Td>{r.is_visible_in_card ? "yes" : "no"}</Td>
            <Td>{r.is_system ? "yes" : "no"}</Td>
            <Td>
              <Link
                href={`/categories/${categoryId}/attributes/${encodeURIComponent(r.attribute_key)}`}
                data-testid={`binding-edit-${r.attribute_key}`}
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
