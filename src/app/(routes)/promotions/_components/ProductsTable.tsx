// src/app/(routes)/promotions/_components/ProductsTable.tsx
"use client";
import { Fragment, useState } from "react";
import type { ProductRead } from "@/lib/promotions/types";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";
import EmptyState from "@/app/_components/ui/EmptyState";
import { deactivateProductAction } from "../actions";
import ActiveBadge from "./ActiveBadge";
import DeactivateButton from "./DeactivateButton";
import ProductForm from "./ProductForm";

export default function ProductsTable({ rows }: { rows: ProductRead[] }) {
  const [editing, setEditing] = useState<number | null>(null);
  if (rows.length === 0)
    return <EmptyState data-testid="products-empty">No promotion products yet.</EmptyState>;
  return (
    <Table data-testid="products-table">
      <Thead>
        <tr>
          <Th>Code</Th>
          <Th>Name (en)</Th>
          <Th>Billing unit</Th>
          <Th>Scope</Th>
          <Th>Status</Th>
          <Th />
        </tr>
      </Thead>
      <Tbody>
        {rows.map((r) => (
          <Fragment key={r.id}>
            <Tr data-testid={`product-row-${r.id}`}>
              <Td className="font-mono text-xs">{r.code}</Td>
              <Td>{r.name_translations.en ?? "—"}</Td>
              <Td>{r.default_billing_unit}</Td>
              <Td>{r.service_scope}</Td>
              <Td data-testid={`product-status-${r.id}`}>
                <ActiveBadge isActive={r.is_active} />
              </Td>
              <Td className="space-x-2 whitespace-nowrap">
                <button
                  type="button"
                  data-testid={`product-edit-${r.id}`}
                  onClick={() =>
                    setEditing((cur) => (cur === r.id ? null : r.id))
                  }
                  className="text-primary-hover"
                >
                  {editing === r.id ? "Close" : "Edit"}
                </button>
                {r.is_active ? (
                  <DeactivateButton
                    id={r.id}
                    action={deactivateProductAction}
                    testid={`product-deactivate-${r.id}`}
                    confirmLabel="Deactivate this product?"
                  />
                ) : null}
              </Td>
            </Tr>
            {editing === r.id ? (
              <Tr>
                <Td colSpan={6} className="bg-zinc-50 p-3">
                  <ProductForm mode="edit" product={r} />
                </Td>
              </Tr>
            ) : null}
          </Fragment>
        ))}
      </Tbody>
    </Table>
  );
}
