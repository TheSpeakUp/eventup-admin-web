// src/app/(routes)/traffic/listings/[type]/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingDetail } from "@/lib/traffic/api";
import {
  formatCount,
  formatCtr,
  isListingType,
} from "@/lib/traffic/types";
import TrendSparkline from "../../../_components/TrendSparkline";

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { type, id } = await params;
  const sp = await searchParams;
  if (!isListingType(type)) notFound();
  const subjectId = Number(id);
  if (!Number.isInteger(subjectId)) notFound();

  const res = await getListingDetail(type, subjectId, {
    date_from: sp.from,
    date_to: sp.to,
  });

  if (!res.ok) {
    return (
      <div className="p-8">
        <Link href="/traffic" className="text-sm text-blue-600 hover:underline">
          ← Back to traffic
        </Link>
        <div
          data-testid="listing-detail-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {res.status === 403
            ? "Viewing traffic analytics requires an admin role."
            : res.status === 404
              ? `No traffic data for ${type} #${subjectId}.`
              : `Failed to load listing: ${res.message}`}
        </div>
      </div>
    );
  }

  const d = res.data;

  return (
    <div className="p-8">
      <Link href="/traffic" className="text-sm text-blue-600 hover:underline">
        ← Back to traffic
      </Link>
      <h1 className="mt-2 text-2xl font-semibold capitalize">
        {type} #{d.subject_id} traffic
      </h1>
      <p className="text-sm text-zinc-500" data-testid="listing-detail-window">
        {d.date_from} → {d.date_to}
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3" data-testid="listing-detail-cards">
        <div className="rounded border border-zinc-200 bg-surface-1 px-4 py-3">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Views</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {formatCount(d.total_views)}
          </div>
        </div>
        <div className="rounded border border-zinc-200 bg-surface-1 px-4 py-3">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Clicks</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {formatCount(d.total_clicks)}
          </div>
        </div>
        <div className="rounded border border-zinc-200 bg-surface-1 px-4 py-3">
          <div className="text-xs uppercase tracking-wide text-zinc-500">CTR</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {formatCtr(d.ctr)}
          </div>
        </div>
      </div>

      <section className="mt-6 rounded border border-zinc-200 bg-surface-1 p-4">
        <h2 className="mb-2 text-sm font-semibold text-zinc-700">
          Views &amp; clicks over time
        </h2>
        <TrendSparkline series={d.series} height={120} />
      </section>
    </div>
  );
}
