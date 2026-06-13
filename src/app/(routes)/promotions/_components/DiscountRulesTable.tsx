// src/app/(routes)/promotions/_components/DiscountRulesTable.tsx
"use client";
import { Fragment, useState } from "react";
import type { DiscountRuleRead } from "@/lib/promotions/types";
import { deactivateDiscountRuleAction } from "../actions";
import ActiveBadge from "./ActiveBadge";
import DeactivateButton from "./DeactivateButton";
import DiscountRuleForm from "./DiscountRuleForm";

export default function DiscountRulesTable({
  rows,
}: {
  rows: DiscountRuleRead[];
}) {
  const [editing, setEditing] = useState<number | null>(null);
  if (rows.length === 0)
    return (
      <p data-testid="discount-rules-empty" className="p-4 text-zinc-500">
        No discount rules yet.
      </p>
    );
  return (
    <table className="w-full text-sm" data-testid="discount-rules-table">
      <thead>
        <tr className="text-left text-zinc-500">
          <th className="py-2">Product</th>
          <th>Tariff</th>
          <th>Min units</th>
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
              data-testid={`discount-rule-row-${r.id}`}
            >
              <td className="py-2">{r.product_id ?? "—"}</td>
              <td>{r.tariff_id ?? "—"}</td>
              <td>{r.min_units}</td>
              <td>{r.discount_percent}</td>
              <td data-testid={`discount-rule-status-${r.id}`}>
                <ActiveBadge isActive={r.is_active} />
              </td>
              <td className="space-x-2 whitespace-nowrap">
                <button
                  type="button"
                  data-testid={`discount-rule-edit-${r.id}`}
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
                    action={deactivateDiscountRuleAction}
                    testid={`discount-rule-deactivate-${r.id}`}
                    confirmLabel="Deactivate this discount rule?"
                  />
                ) : null}
              </td>
            </tr>
            {editing === r.id ? (
              <tr className="border-t border-zinc-100">
                <td colSpan={6} className="bg-zinc-50 p-3">
                  <DiscountRuleForm mode="edit" rule={r} />
                </td>
              </tr>
            ) : null}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
