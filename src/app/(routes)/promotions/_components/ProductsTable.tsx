// src/app/(routes)/promotions/_components/ProductsTable.tsx
"use client";
import { Fragment, useState } from "react";
import type { ProductRead } from "@/lib/promotions/types";
import { deactivateProductAction } from "../actions";
import ActiveBadge from "./ActiveBadge";
import DeactivateButton from "./DeactivateButton";
import ProductForm from "./ProductForm";

export default function ProductsTable({ rows }: { rows: ProductRead[] }) {
  const [editing, setEditing] = useState<number | null>(null);
  if (rows.length === 0)
    return (
      <p data-testid="products-empty" className="p-4 text-zinc-500">
        No promotion products yet.
      </p>
    );
  return (
    <table className="w-full text-sm" data-testid="products-table">
      <thead>
        <tr className="text-left text-zinc-500">
          <th className="py-2">Code</th>
          <th>Name (en)</th>
          <th>Billing unit</th>
          <th>Scope</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <Fragment key={r.id}>
            <tr
              className="border-t border-zinc-200"
              data-testid={`product-row-${r.id}`}
            >
              <td className="py-2 font-mono text-xs">{r.code}</td>
              <td>{r.name_translations.en ?? "—"}</td>
              <td>{r.default_billing_unit}</td>
              <td>{r.service_scope}</td>
              <td data-testid={`product-status-${r.id}`}>
                <ActiveBadge isActive={r.is_active} />
              </td>
              <td className="space-x-2 whitespace-nowrap">
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
              </td>
            </tr>
            {editing === r.id ? (
              <tr className="border-t border-zinc-100">
                <td colSpan={6} className="bg-zinc-50 p-3">
                  <ProductForm mode="edit" product={r} />
                </td>
              </tr>
            ) : null}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
