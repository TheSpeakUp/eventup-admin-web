// src/app/(routes)/promotions/_components/ZonesTable.tsx
"use client";
import { Fragment, useState } from "react";
import type { ZoneRead } from "@/lib/promotions/types";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";
import EmptyState from "@/app/_components/ui/EmptyState";
import ZoneForm from "./ZoneForm";

export default function ZonesTable({ rows }: { rows: ZoneRead[] }) {
  const [editing, setEditing] = useState<number | null>(null);
  if (rows.length === 0)
    return <EmptyState data-testid="zones-empty">No promotion zones yet.</EmptyState>;
  return (
    <Table data-testid="zones-table">
      <Thead>
        <tr>
          <Th>Code</Th>
          <Th>Time granularity</Th>
          <Th>Max slots</Th>
          <Th />
        </tr>
      </Thead>
      <Tbody>
        {rows.map((r) => (
          <Fragment key={r.id}>
            <Tr data-testid={`zone-row-${r.id}`}>
              <Td className="font-mono text-xs">{r.code}</Td>
              <Td>{r.time_granularity}</Td>
              <Td>{r.max_slots}</Td>
              <Td className="whitespace-nowrap">
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
              </Td>
            </Tr>
            {editing === r.id ? (
              <Tr>
                <Td colSpan={4} className="bg-zinc-50 p-3">
                  <ZoneForm mode="edit" zone={r} />
                </Td>
              </Tr>
            ) : null}
          </Fragment>
        ))}
      </Tbody>
    </Table>
  );
}
