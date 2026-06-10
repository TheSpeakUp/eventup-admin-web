// src/app/(routes)/quality/_components/FormulaConfigsTable.tsx
// Versioned formula configs list. The active version is marked with a badge.
// SUPERADMIN gets a per-row Activate (on inactive rows) plus a top-level
// Rollback. Non-SUPERADMIN sees no write controls (canManage=false).
import type { FormulaConfigRead } from "@/lib/quality/types";
import ActivateConfigButton from "./ActivateConfigButton";
import RollbackConfigButton from "./RollbackConfigButton";

export default function FormulaConfigsTable({
  rows,
  canManage,
}: {
  rows: FormulaConfigRead[];
  canManage: boolean;
}) {
  if (rows.length === 0)
    return (
      <p data-testid="formula-configs-empty" className="p-4 text-zinc-500">
        No formula configs yet.
      </p>
    );
  return (
    <div className="space-y-4">
      {canManage ? (
        <div data-testid="formula-rollback-panel">
          <RollbackConfigButton />
        </div>
      ) : null}
      <table className="w-full text-sm" data-testid="formula-configs-table">
        <thead>
          <tr className="text-left text-zinc-500">
            <th className="py-2">Config</th>
            <th>Version</th>
            <th>Description</th>
            <th>Status</th>
            <th>Activated</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-t border-zinc-200"
              data-testid={`formula-config-row-${r.id}`}
            >
              <td className="py-2 font-mono text-xs">#{r.id}</td>
              <td className="font-medium">{r.version}</td>
              <td className="text-zinc-600">{r.description ?? "—"}</td>
              <td data-testid={`formula-config-status-${r.id}`}>
                {r.is_active ? (
                  <span
                    data-testid={`formula-config-active-${r.id}`}
                    className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200"
                  >
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-200">
                    Inactive
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap text-zinc-500">
                {r.activated_at ?? "—"}
              </td>
              <td className="whitespace-nowrap">
                {canManage && !r.is_active ? (
                  <ActivateConfigButton id={r.id} />
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
