"use client";

const FIELD =
  "rounded-md border border-hairline bg-surface-1 px-2.5 py-1.5 text-sm text-ink focus:border-primary-focus focus:outline-none";

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
      <label className="flex flex-col gap-1 text-xs text-ink-subtle">
        From
        <input type="date" name="from" defaultValue={from} className={FIELD} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink-subtle">
        To
        <input type="date" name="to" defaultValue={to} className={FIELD} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink-subtle">
        Granularity
        <select name="granularity" defaultValue={granularity} className={FIELD}>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </label>
      <button
        type="submit"
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        Apply
      </button>
    </form>
  );
}
