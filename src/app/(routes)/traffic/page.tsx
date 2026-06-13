// src/app/(routes)/traffic/page.tsx
import Link from "next/link";
import { getAnalyticsSummary, getTopListings } from "@/lib/traffic/api";
import { isListingType, type ListingType } from "@/lib/traffic/types";
import SummaryCards from "./_components/SummaryCards";
import TrendSparkline from "./_components/TrendSparkline";
import ListingStatTable from "./_components/ListingStatTable";
import ExportCsvButton from "./_components/ExportCsvButton";

function ErrorPanel({ message, status }: { message: string; status: number }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Traffic</h1>
      <div
        data-testid="traffic-error"
        className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
      >
        {status === 403
          ? "Viewing traffic analytics requires an admin role."
          : `Failed to load traffic: ${message}`}
      </div>
    </div>
  );
}

export default async function TrafficPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const type: ListingType =
    sp.type && isListingType(sp.type) ? sp.type : "service";
  const win = { date_from: sp.from, date_to: sp.to };

  const [summaryRes, topRes] = await Promise.all([
    getAnalyticsSummary(win),
    getTopListings(type, win),
  ]);

  if (!summaryRes.ok) {
    return <ErrorPanel message={summaryRes.message} status={summaryRes.status} />;
  }
  if (!topRes.ok) {
    return <ErrorPanel message={topRes.message} status={topRes.status} />;
  }

  const summary = summaryRes.data;
  const top = topRes.data;

  const typeHref = (t: ListingType) => {
    const p = new URLSearchParams();
    p.set("type", t);
    if (sp.from) p.set("from", sp.from);
    if (sp.to) p.set("to", sp.to);
    return `/traffic?${p.toString()}`;
  };

  const window = `${summary.date_from} → ${summary.date_to}`;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Traffic</h1>
        <span className="text-sm text-zinc-500" data-testid="traffic-window">
          {window}
        </span>
      </div>

      <form className="mt-4 flex items-end gap-2" data-testid="traffic-window-form">
        <label className="flex flex-col text-xs text-zinc-500">
          From
          <input
            type="date"
            name="from"
            defaultValue={sp.from ?? ""}
            className="rounded border px-2 py-1 text-sm text-zinc-800"
          />
        </label>
        <label className="flex flex-col text-xs text-zinc-500">
          To
          <input
            type="date"
            name="to"
            defaultValue={sp.to ?? ""}
            className="rounded border px-2 py-1 text-sm text-zinc-800"
          />
        </label>
        <input type="hidden" name="type" value={type} />
        <button type="submit" className="rounded border px-3 py-1.5 text-sm">
          Apply
        </button>
      </form>

      <div className="mt-6">
        <SummaryCards summary={summary} />
      </div>

      <section className="mt-6 rounded border border-zinc-200 bg-surface-1 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">
            Views &amp; clicks trend
          </h2>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-sm bg-blue-600" />
              Views
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-sm bg-green-600" />
              Clicks
            </span>
          </div>
        </div>
        <TrendSparkline series={summary.series} />
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <div
            className="inline-flex rounded border border-zinc-200 bg-surface-1 p-0.5 text-sm"
            data-testid="traffic-type-switch"
          >
            {(["service", "offer"] as const).map((t) => (
              <Link
                key={t}
                href={typeHref(t)}
                data-testid={`traffic-type-${t}`}
                data-active={t === type}
                className={`rounded px-3 py-1 capitalize ${
                  t === type
                    ? "bg-primary text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {t}s
              </Link>
            ))}
          </div>
          <ExportCsvButton
            rows={top.top}
            filename={`traffic-top-${type}-${summary.date_from}_${summary.date_to}.csv`}
          />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-zinc-700">
          Top {type}s by views
        </h3>
        <div className="mt-2">
          <ListingStatTable
            rows={top.top}
            type={type}
            testid="traffic-top-table"
            emptyLabel={`No ${type} traffic in this window.`}
          />
        </div>

        <h3 className="mt-6 text-sm font-semibold text-zinc-700">
          Anti-top — high views, low CTR
        </h3>
        <p className="text-xs text-zinc-400">
          Listings drawing attention but converting poorly — review copy,
          pricing, or imagery.
        </p>
        <div className="mt-2">
          <ListingStatTable
            rows={top.anti_top}
            type={type}
            testid="traffic-antitop-table"
            emptyLabel={`No under-performing ${type}s in this window.`}
          />
        </div>
      </section>
    </div>
  );
}
