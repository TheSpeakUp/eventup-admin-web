import Link from "next/link";
import EmptyState from "@/app/_components/ui/EmptyState";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";
import type { AttributeDefinitionRead } from "@/lib/attribute-definitions/types";

export function AttributeDefinitionsTable({
  rows,
}: {
  rows: AttributeDefinitionRead[];
}) {
  if (rows.length === 0)
    return (
      <EmptyState data-testid="attribute-definitions-empty">
        No attribute definitions yet.
      </EmptyState>
    );
  return (
    <Table data-testid="attribute-definitions-table">
      <Thead>
        <tr>
          <Th>Key</Th>
          <Th>Group</Th>
          <Th>Sort</Th>
          <Th>Active</Th>
          <Th>System</Th>
          <Th>Bindings</Th>
          <Th />
        </tr>
      </Thead>
      <Tbody>
        {rows.map((r) => (
          <Tr key={r.key} data-testid={`attribute-definition-row-${r.key}`}>
            <Td>{r.key}</Td>
            <Td>{r.group_name ?? "—"}</Td>
            <Td>{r.sort_order}</Td>
            <Td>{r.is_active ? "yes" : "no"}</Td>
            <Td>{r.is_system ? "yes" : "no"}</Td>
            <Td>{r.bindings_count}</Td>
            <Td>
              <Link
                href={`/attribute-definitions/${encodeURIComponent(r.key)}`}
                data-testid={`attribute-definition-edit-${r.key}`}
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
