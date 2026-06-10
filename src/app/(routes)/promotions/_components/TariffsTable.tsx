// src/app/(routes)/promotions/_components/TariffsTable.tsx
"use client";
import { Fragment, useState } from "react";
import type { TariffRead } from "@/lib/promotions/types";
import TariffForm from "./TariffForm";

export default function TariffsTable({ rows }: { rows: TariffRead[] }) {
  const [editing, setEditing] = useState<number | null>(null);
  if (rows.length === 0)
    return (
      <p data-testid="tariffs-empty" className="p-4 text-zinc-500">
        No promotion tariffs yet.
      </p>
    );
  return (
    <table className="w-full text-sm" data-testid="tariffs-table">
      <thead>
        <tr className="text-left text-zinc-500">
          <th className="py-2">Product id</th>
          <th>Billing unit</th>
          <th>Base price</th>
          <th>Currency</th>
          <th>Min units</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <Fragment key={r.id}>
            <tr
              className="border-t border-zinc-200"
              data-testid={`tariff-row-${r.id}`}
            >
              <td className="py-2">{r.product_id}</td>
              <td>{r.billing_unit}</td>
              <td>{r.base_price}</td>
              <td>{r.currency}</td>
              <td>{r.min_units}</td>
              <td className="whitespace-nowrap">
                <button
                  type="button"
                  data-testid={`tariff-edit-${r.id}`}
                  onClick={() =>
                    setEditing((cur) => (cur === r.id ? null : r.id))
                  }
                  className="text-blue-700"
                >
                  {editing === r.id ? "Close" : "Edit"}
                </button>
              </td>
            </tr>
            {editing === r.id ? (
              <tr className="border-t border-zinc-100">
                <td colSpan={6} className="bg-zinc-50 p-3">
                  <TariffForm mode="edit" tariff={r} />
                </td>
              </tr>
            ) : null}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
