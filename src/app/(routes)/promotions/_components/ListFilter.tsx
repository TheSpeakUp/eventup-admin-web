// src/app/(routes)/promotions/_components/ListFilter.tsx
// Status + service_id filter bar for the orders / campaigns lists. A plain GET
// form so the filters ride searchParams (server component re-renders); the
// hidden tab field keeps the active tab on submit. Clearing both and submitting
// drops back to the unfiltered list.
import Link from "next/link";

export default function ListFilter({
  tab,
  status,
  serviceId,
  statuses,
  testid,
}: {
  tab: "orders" | "campaigns";
  status?: string;
  serviceId?: number;
  statuses: string[];
  testid: string;
}) {
  return (
    <form
      method="GET"
      action="/promotions"
      data-testid={`${testid}-filter`}
      className="flex flex-wrap items-end gap-2 text-sm"
    >
      <input type="hidden" name="tab" value={tab} />
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">Status</span>
        <select
          name="status"
          defaultValue={status ?? ""}
          data-testid={`${testid}-filter-status`}
          className="rounded border border-zinc-300 px-2 py-1"
        >
          <option value="">All</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">Service id</span>
        <input
          type="number"
          name="service_id"
          defaultValue={serviceId ?? ""}
          data-testid={`${testid}-filter-service`}
          className="w-28 rounded border border-zinc-300 px-2 py-1"
        />
      </label>
      <button
        type="submit"
        data-testid={`${testid}-filter-apply`}
        className="rounded bg-zinc-900 px-3 py-1 text-white"
      >
        Apply
      </button>
      {status || serviceId !== undefined ? (
        <Link
          href={`/promotions?tab=${tab}`}
          data-testid={`${testid}-filter-clear`}
          className="px-2 py-1 text-zinc-600"
        >
          Clear
        </Link>
      ) : null}
    </form>
  );
}
