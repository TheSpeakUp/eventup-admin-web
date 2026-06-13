// src/app/(routes)/promotions/_components/TariffsTable.tsx
"use client";
import { Fragment, useState } from "react";
import type { TariffRead } from "@/lib/promotions/types";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";
import EmptyState from "@/app/_components/ui/EmptyState";
import TariffForm from "./TariffForm";

export default function TariffsTable({ rows }: { rows: TariffRead[] }) {
  const [editing, setEditing] = useState<number | null>(null);
  if (rows.length === 0)
    return <EmptyState data-testid="tariffs-empty">No promotion tariffs yet.</EmptyState>;
  return (
    <Table data-testid="tariffs-table">
      <Thead>
        <tr>
          <Th>Product id</Th>
          <Th>Billing unit</Th>
          <Th>Base price</Th>
          <Th>Currency</Th>
          <Th>Min units</Th>
          <Th />
        </tr>
      </Thead>
      <Tbody>
        {rows.map((r) => (
          <Fragment key={r.id}>
            <Tr data-testid={`tariff-row-${r.id}`}>
              <Td>{r.product_id}</Td>
              <Td>{r.billing_unit}</Td>
              <Td>{r.base_price}</Td>
              <Td>{r.currency}</Td>
              <Td>{r.min_units}</Td>
              <Td className="whitespace-nowrap">
                <button
                  type="button"
                  data-testid={`tariff-edit-${r.id}`}
                  onClick={() =>
                    setEditing((cur) => (cur === r.id ? null : r.id))
                  }
                  className="text-primary-hover"
                >
                  {editing === r.id ? "Close" : "Edit"}
                </button>
              </Td>
            </Tr>
            {editing === r.id ? (
              <Tr>
                <Td colSpan={6} className="bg-zinc-50 p-3">
                  <TariffForm mode="edit" tariff={r} />
                </Td>
              </Tr>
            ) : null}
          </Fragment>
        ))}
      </Tbody>
    </Table>
  );
}
