"use client";

export default function DateRangeControls({
  from,
  to,
  granularity,
}: {
  from: string;
  to: string;
  granularity: "day" | "week" | "month";
}) {
  return (
    <form
      className="flex items-end gap-2"
      method="GET"
      action=""
      data-testid="dashboard-date-range-form"
    >
      <label className="flex flex-col text-xs text-zinc-500">
        From
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="rounded border px-2 py-1 text-sm text-zinc-800"
        />
      </label>
      <label className="flex flex-col text-xs text-zinc-500">
        To
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="rounded border px-2 py-1 text-sm text-zinc-800"
        />
      </label>
      <label className="flex flex-col text-xs text-zinc-500">
        Granularity
        <select
          name="granularity"
          defaultValue={granularity}
          className="rounded border px-2 py-1 text-sm text-zinc-800"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </label>
      <button
        type="submit"
        className="rounded border px-3 py-1.5 text-sm hover:bg-zinc-100"
      >
        Apply
      </button>
    </form>
  );
}
