// src/app/(routes)/promo-codes/page.tsx
import Link from "next/link";
import { listPromoCodes } from "@/lib/promo-codes/api";
import type { PromoCodeFilter } from "@/lib/promo-codes/types";
import PromoCodesTable from "./_components/PromoCodesTable";
import PromoCodesGrid from "./_components/PromoCodesGrid";
import { loadMorePromoCodes } from "./load-more-action";
import { PROMO_GRID_LIMIT } from "./grid-config";
import { buttonClass } from "@/app/_components/ui/Button";
import {
  Alert,
  PageHeader,
  Panel,
  StatusSegments,
  ViewToggle,
  parseView,
  type SegmentOption,
} from "@/app/_components/ui";

const STATUS_OPTIONS: SegmentOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default async function PromoCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; status?: string; view?: string }>;
}) {
  const sp = await searchParams;
  const status =
    sp.status === "active" || sp.status === "inactive" ? sp.status : undefined;
  const view = parseView(sp.view);

  // Grid accumulates client-side from page one, so it fetches a grid-sized
  // first page from offset 0; the table keeps its larger single-page load.
  const filter: PromoCodeFilter = {
    limit: view === "grid" ? PROMO_GRID_LIMIT : 100,
  };
  if (sp.code) filter.code = sp.code;
  if (status === "active") filter.is_active = true;
  if (status === "inactive") filter.is_active = false;

  const result = await listPromoCodes(filter);

  if (!result.ok) {
    return (
      <div className="p-8 space-y-5">
        <PageHeader
          title="Promo codes"
          description="Marketplace promo codes, targeting and redemption limits."
        />
        <Alert variant="danger" data-testid="promo-codes-error">
          {result.status === 403
            ? "Viewing promo codes requires an admin role."
            : `Failed to load promo codes: ${result.message}`}
        </Alert>
      </div>
    );
  }

  const rows = result.data.items;
  const { total, has_more } = result.data;
  const otherParams = { code: sp.code };

  return (
    <div className="p-8 space-y-5">
      <PageHeader
        title="Promo codes"
        description="Marketplace promo codes, targeting and redemption limits."
        actions={
          <Link
            href="/promo-codes/new"
            data-testid="promo-new"
            className={buttonClass("primary")}
          >
            New promo code
          </Link>
        }
      />

      <Panel title="Promo codes" accent="primary" bodyClassName="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3">
          <StatusSegments
            param="status"
            options={STATUS_OPTIONS}
            current={status}
            basePath="/promo-codes"
            searchParams={otherParams}
            testidPrefix="promo-status"
          />
          <div className="flex items-center gap-2">
            <form className="flex gap-2" data-testid="promo-codes-search">
              {/* GET form — carry the active status segment so a code search
                  doesn't drop the current active/inactive filter. */}
              {status ? (
                <input type="hidden" name="status" value={status} />
              ) : null}
              <input
                name="code"
                placeholder="Search by code"
                defaultValue={sp.code ?? ""}
                className="h-9 rounded-md border border-hairline bg-surface-2 px-2 text-sm text-ink focus:border-hairline-strong focus:outline-none"
              />
              <button type="submit" className={buttonClass("secondary", "sm")}>
                Apply
              </button>
            </form>
            <ViewToggle
              current={view}
              basePath="/promo-codes"
              searchParams={{ status, code: sp.code }}
              testidPrefix="promo-view"
            />
          </div>
        </div>
        {view === "grid" ? (
          // Re-key on the filter signature so a soft-nav filter change remounts
          // the grid and reseeds the accumulator instead of stale-appending.
          <PromoCodesGrid
            key={`${status ?? ""}|${sp.code ?? ""}`}
            initial={{
              items: rows,
              nextCursor: has_more ? String(PROMO_GRID_LIMIT) : null,
              hasMore: has_more,
            }}
            loadAction={loadMorePromoCodes.bind(null, {
              status,
              code: sp.code,
            })}
            total={total}
          />
        ) : (
          <PromoCodesTable rows={rows} />
        )}
      </Panel>
    </div>
  );
}
