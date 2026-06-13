/**
 * Ranked horizontal bar list — the enterprise pattern for "top N by value".
 * Each row's bar width is proportional to the largest value, so relative scale
 * is readable at a glance instead of buried in a table column.
 */
export type BarListItem = {
  label: string;
  /** numeric value used to size the bar */
  value: number;
  /** formatted value shown on the right (e.g. "$900 · 6") */
  valueLabel: string;
  sublabel?: string;
};

export default function BarList({
  items,
  emptyMessage = "No data",
  testid,
}: {
  items: BarListItem[];
  emptyMessage?: string;
  testid?: string;
}) {
  if (items.length === 0) {
    return <div className="text-xs text-ink-subtle" data-testid={testid}>{emptyMessage}</div>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-1.5" data-testid={testid}>
      {items.map((item, idx) => {
        const pct = Math.max((item.value / max) * 100, 2);
        return (
          <div key={`${item.label}-${idx}`} className="relative">
            <div
              className="absolute inset-y-0 left-0 rounded-md bg-primary/15"
              style={{ width: `${pct}%` }}
              aria-hidden
            />
            <div className="relative flex items-center justify-between px-2.5 py-1.5 text-sm">
              <span className="truncate text-ink">
                {item.label}
                {item.sublabel ? (
                  <span className="ml-2 text-xs text-ink-subtle">{item.sublabel}</span>
                ) : null}
              </span>
              <span className="ml-3 shrink-0 font-medium tabular-nums text-ink-muted">
                {item.valueLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
