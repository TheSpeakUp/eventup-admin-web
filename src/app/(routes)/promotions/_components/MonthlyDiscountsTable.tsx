// src/app/(routes)/promotions/_components/MonthlyDiscountsTable.tsx
"use client";
import { Fragment, useState } from "react";
import type { MonthlyDiscountRead } from "@/lib/promotions/types";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";
import EmptyState from "@/app/_components/ui/EmptyState";
import { deactivateMonthlyDiscountAction } from "../actions";
import ActiveBadge from "./ActiveBadge";
import DeactivateButton from "./DeactivateButton";
import MonthlyDiscountForm from "./MonthlyDiscountForm";

export default function MonthlyDiscountsTable({
  rows,
}: {
  rows: MonthlyDiscountRead[];
}) {
  const [editing, setEditing] = useState<number | null>(null);
  if (rows.length === 0)
    return <EmptyState data-testid="monthly-discounts-empty">No monthly discounts yet.</EmptyState>;
  return (
    <Table data-testid="monthly-discounts-table">
      <Thead>
        <tr>
          <Th>Month start</Th>
          <Th>Product</Th>
          <Th>Tariff</Th>
          <Th>Discount %</Th>
          <Th>Status</Th>
          <Th />
        </tr>
      </Thead>
      <Tbody>
        {rows.map((r) => (
          <Fragment key={r.id}>
            <Tr data-testid={`monthly-discount-row-${r.id}`}>
              <Td>{r.month_start}</Td>
              <Td>{r.product_id ?? "—"}</Td>
              <Td>{r.tariff_id ?? "—"}</Td>
              <Td>{r.discount_percent}</Td>
              <Td data-testid={`monthly-discount-status-${r.id}`}>
                <ActiveBadge isActive={r.is_active} />
              </Td>
              <Td className="space-x-2 whitespace-nowrap">
                <button
                  type="button"
                  data-testid={`monthly-discount-edit-${r.id}`}
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
                    action={deactivateMonthlyDiscountAction}
                    testid={`monthly-discount-deactivate-${r.id}`}
                    confirmLabel="Deactivate this monthly discount?"
                  />
                ) : null}
              </Td>
            </Tr>
            {editing === r.id ? (
              <Tr>
                <Td colSpan={6} className="bg-zinc-50 p-3">
                  <MonthlyDiscountForm mode="edit" discount={r} />
                </Td>
              </Tr>
            ) : null}
          </Fragment>
        ))}
      </Tbody>
    </Table>
  );
}
