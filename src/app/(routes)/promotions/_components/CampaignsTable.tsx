// src/app/(routes)/promotions/_components/CampaignsTable.tsx
// Campaigns list + per-row Cancel (gated to non-canceled rows). Each row links
// to the detail route (GET /promotions/campaigns/{id}).
import Link from "next/link";
import type { CampaignRead } from "@/lib/promotions/types";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";
import EmptyState from "@/app/_components/ui/EmptyState";
import CancelCampaignButton from "./CancelCampaignButton";
import StatusPill from "./StatusPill";

const TERMINAL = new Set(["canceled", "cancelled", "expired"]);

export default function CampaignsTable({ rows }: { rows: CampaignRead[] }) {
  if (rows.length === 0)
    return <EmptyState data-testid="campaigns-empty">No promotion campaigns yet.</EmptyState>;
  return (
    <Table data-testid="campaigns-table">
      <Thead>
        <tr>
          <Th>Campaign</Th>
          <Th>Service</Th>
          <Th>Product</Th>
          <Th>Window</Th>
          <Th>Status</Th>
          <Th />
        </tr>
      </Thead>
      <Tbody>
        {rows.map((r) => (
          <Tr key={r.id} data-testid={`campaign-row-${r.id}`}>
            <Td className="font-mono text-xs">#{r.id}</Td>
            <Td>{r.service_id}</Td>
            <Td>{r.product_id}</Td>
            <Td className="whitespace-nowrap text-zinc-500">
              {r.start_date} → {r.end_date}
            </Td>
            <Td data-testid={`campaign-status-${r.id}`}>
              <StatusPill status={r.status} />
            </Td>
            <Td className="space-x-2 whitespace-nowrap">
              <Link
                href={`/promotions/campaigns/${r.id}`}
                data-testid={`campaign-view-${r.id}`}
                className="text-primary-hover"
              >
                View
              </Link>
              {TERMINAL.has(r.status) ? null : (
                <CancelCampaignButton id={r.id} />
              )}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
