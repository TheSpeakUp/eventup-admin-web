// src/app/(routes)/promotions/_components/CampaignsTable.tsx
// Campaigns list + per-row Cancel (gated to non-canceled rows). Each row links
// to the detail route (GET /promotions/campaigns/{id}).
import Link from "next/link";
import type { CampaignRead } from "@/lib/promotions/types";
import CancelCampaignButton from "./CancelCampaignButton";
import StatusPill from "./StatusPill";

const TERMINAL = new Set(["canceled", "cancelled", "expired"]);

export default function CampaignsTable({ rows }: { rows: CampaignRead[] }) {
  if (rows.length === 0)
    return (
      <p data-testid="campaigns-empty" className="p-4 text-zinc-500">
        No promotion campaigns yet.
      </p>
    );
  return (
    <table className="w-full text-sm" data-testid="campaigns-table">
      <thead>
        <tr className="text-left text-zinc-500">
          <th className="py-2">Campaign</th>
          <th>Service</th>
          <th>Product</th>
          <th>Window</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.id}
            className="border-t border-zinc-200"
            data-testid={`campaign-row-${r.id}`}
          >
            <td className="py-2 font-mono text-xs">#{r.id}</td>
            <td>{r.service_id}</td>
            <td>{r.product_id}</td>
            <td className="whitespace-nowrap text-zinc-500">
              {r.start_date} → {r.end_date}
            </td>
            <td data-testid={`campaign-status-${r.id}`}>
              <StatusPill status={r.status} />
            </td>
            <td className="space-x-2 whitespace-nowrap">
              <Link
                href={`/promotions/campaigns/${r.id}`}
                data-testid={`campaign-view-${r.id}`}
                className="text-blue-700"
              >
                View
              </Link>
              {TERMINAL.has(r.status) ? null : (
                <CancelCampaignButton id={r.id} />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
