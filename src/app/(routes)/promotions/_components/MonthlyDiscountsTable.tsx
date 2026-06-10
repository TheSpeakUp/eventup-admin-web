// src/app/(routes)/promotions/_components/MonthlyDiscountsTable.tsx
"use client";
import { Fragment, useState } from "react";
import type { MonthlyDiscountRead } from "@/lib/promotions/types";
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
    return (
      <p data-testid="monthly-discounts-empty" className="p-4 text-zinc-500">
        No monthly discounts yet.
      </p>
    );
  return (
    <table className="w-full text-sm" data-testid="monthly-discounts-table">
      <thead>
        <tr className="text-left text-zinc-500">
          <th className="py-2">Month start</th>
          <th>Product</th>
          <th>Tariff</th>
          <th>Discount %</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <Fragment key={r.id}>
            <tr
              className="border-t border-zinc-200"
              data-testid={`monthly-discount-row-${r.id}`}
            >
              <td className="py-2">{r.month_start}</td>
              <td>{r.product_id ?? "—"}</td>
              <td>{r.tariff_id ?? "—"}</td>
              <td>{r.discount_percent}</td>
              <td data-testid={`monthly-discount-status-${r.id}`}>
                <ActiveBadge isActive={r.is_active} />
              </td>
              <td className="space-x-2 whitespace-nowrap">
                <button
                  type="button"
                  data-testid={`monthly-discount-edit-${r.id}`}
                  onClick={() =>
                    setEditing((cur) => (cur === r.id ? null : r.id))
                  }
                  className="text-blue-700"
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
              </td>
            </tr>
            {editing === r.id ? (
              <tr className="border-t border-zinc-100">
                <td colSpan={6} className="bg-zinc-50 p-3">
                  <MonthlyDiscountForm mode="edit" discount={r} />
                </td>
              </tr>
            ) : null}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
