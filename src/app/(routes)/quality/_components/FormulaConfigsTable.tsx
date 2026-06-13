// src/app/(routes)/quality/_components/FormulaConfigsTable.tsx
// Versioned formula configs list. The active version is marked with a badge.
// SUPERADMIN gets a per-row Activate (on inactive rows) plus a top-level
// Rollback. Non-SUPERADMIN sees no write controls (canManage=false).
import type { FormulaConfigRead } from "@/lib/quality/types";
import Badge from "@/app/_components/ui/Badge";
import EmptyState from "@/app/_components/ui/EmptyState";
import { Table, THead, TBody, Tr, Th, Td } from "@/app/_components/ui/Table";
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
      <EmptyState testid="formula-configs-empty">
        No formula configs yet.
      </EmptyState>
    );
  return (
    <div className="space-y-4">
      {canManage ? (
        <div data-testid="formula-rollback-panel">
          <RollbackConfigButton />
        </div>
      ) : null}
      <div data-testid="formula-configs-table">
      <Table>
        <THead>
          <Tr>
            <Th>Config</Th>
            <Th>Version</Th>
            <Th>Description</Th>
            <Th>Status</Th>
            <Th>Activated</Th>
            <Th />
          </Tr>
        </THead>
        <TBody>
          {rows.map((r) => (
            <Tr key={r.id} data-testid={`formula-config-row-${r.id}`}>
              <Td className="font-mono text-xs">#{r.id}</Td>
              <Td className="font-medium">{r.version}</Td>
              <Td className="text-ink-subtle">{r.description ?? "—"}</Td>
              <Td data-testid={`formula-config-status-${r.id}`}>
                {r.is_active ? (
                  <span
                    data-testid={`formula-config-active-${r.id}`}
                    className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
                  >
                    Active
                  </span>
                ) : (
                  <Badge tone="neutral">Inactive</Badge>
                )}
              </Td>
              <Td className="whitespace-nowrap text-ink-subtle">
                {r.activated_at ?? "—"}
              </Td>
              <Td className="whitespace-nowrap">
                {canManage && !r.is_active ? (
                  <ActivateConfigButton id={r.id} />
                ) : null}
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
      </div>
    </div>
  );
}
