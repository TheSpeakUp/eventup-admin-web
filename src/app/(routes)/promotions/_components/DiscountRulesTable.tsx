// src/app/(routes)/promotions/_components/DiscountRulesTable.tsx
"use client";
import { Fragment, useState } from "react";
import type { DiscountRuleRead } from "@/lib/promotions/types";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";
import EmptyState from "@/app/_components/ui/EmptyState";
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
    return <EmptyState data-testid="discount-rules-empty">No discount rules yet.</EmptyState>;
  return (
    <Table data-testid="discount-rules-table">
      <Thead>
        <tr>
          <Th>Product</Th>
          <Th>Tariff</Th>
          <Th>Min units</Th>
          <Th>Discount %</Th>
          <Th>Status</Th>
          <Th />
        </tr>
      </Thead>
      <Tbody>
        {rows.map((r) => (
          <Fragment key={r.id}>
            <Tr data-testid={`discount-rule-row-${r.id}`}>
              <Td>{r.product_id ?? "—"}</Td>
              <Td>{r.tariff_id ?? "—"}</Td>
              <Td>{r.min_units}</Td>
              <Td>{r.discount_percent}</Td>
              <Td data-testid={`discount-rule-status-${r.id}`}>
                <ActiveBadge isActive={r.is_active} />
              </Td>
              <Td className="space-x-2 whitespace-nowrap">
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
              </Td>
            </Tr>
            {editing === r.id ? (
              <Tr>
                <Td colSpan={6} className="bg-zinc-50 p-3">
                  <DiscountRuleForm mode="edit" rule={r} />
                </Td>
              </Tr>
            ) : null}
          </Fragment>
        ))}
      </Tbody>
    </Table>
  );
}
