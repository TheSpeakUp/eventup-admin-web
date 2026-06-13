// src/app/(routes)/promotions/_components/ZonesTable.tsx
"use client";
import { Fragment, useState } from "react";
import type { ZoneRead } from "@/lib/promotions/types";
import ZoneForm from "./ZoneForm";

export default function ZonesTable({ rows }: { rows: ZoneRead[] }) {
  const [editing, setEditing] = useState<number | null>(null);
  if (rows.length === 0)
    return (
      <p data-testid="zones-empty" className="p-4 text-zinc-500">
        No promotion zones yet.
      </p>
    );
  return (
    <table className="w-full text-sm" data-testid="zones-table">
      <thead>
        <tr className="text-left text-zinc-500">
          <th className="py-2">Code</th>
          <th>Time granularity</th>
          <th>Max slots</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <Fragment key={r.id}>
            <tr
              className="border-t border-zinc-200"
              data-testid={`zone-row-${r.id}`}
            >
              <td className="py-2 font-mono text-xs">{r.code}</td>
              <td>{r.time_granularity}</td>
              <td>{r.max_slots}</td>
              <td className="whitespace-nowrap">
                <button
                  type="button"
                  data-testid={`zone-edit-${r.id}`}
                  onClick={() =>
                    setEditing((cur) => (cur === r.id ? null : r.id))
                  }
                  className="text-primary-hover"
                >
                  {editing === r.id ? "Close" : "Edit"}
                </button>
              </td>
            </tr>
            {editing === r.id ? (
              <tr className="border-t border-zinc-100">
                <td colSpan={4} className="bg-zinc-50 p-3">
                  <ZoneForm mode="edit" zone={r} />
                </td>
              </tr>
            ) : null}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
