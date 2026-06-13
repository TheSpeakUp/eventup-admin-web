import Link from "next/link";

export type SegmentOption = { value: string; label: string };

/**
 * Server-rendered segmented status filter. Replaces the per-domain status
 * `<select>` with a visible row of pill links — an "All" reset plus one segment
 * per status — so the current filter is always on screen (nav-state-active)
 * instead of hidden behind a dropdown. Each link sets `?<param>=<value>`,
 * preserves the other active filters, and resets the page cursor/offset.
 *
 * `searchParams` is the page's other live filters (search, provider_id, …).
 * `current` is the active status value (undefined → "All").
 */
export default function StatusSegments({
  param = "status",
  options,
  current,
  allLabel = "All",
  basePath,
  searchParams = {},
  resetParams = ["last_id", "offset"],
  testidPrefix,
}: {
  param?: string;
  options: SegmentOption[];
  current?: string;
  allLabel?: string;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  resetParams?: string[];
  testidPrefix?: string;
}) {
  function href(value: string | null): string {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== param) sp.set(k, v);
    }
    for (const p of resetParams) sp.delete(p);
    if (value) sp.set(param, value);
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const items: { value: string | null; label: string }[] = [
    { value: null, label: allLabel },
    ...options,
  ];

  return (
    <div
      role="tablist"
      aria-label="Filter by status"
      data-testid={testidPrefix ? `${testidPrefix}-segments` : undefined}
      className="flex flex-wrap items-center gap-1"
    >
      {items.map((it) => {
        const active = (it.value ?? "") === (current ?? "");
        return (
          <Link
            key={it.value ?? "__all"}
            href={href(it.value)}
            role="tab"
            aria-selected={active}
            data-testid={
              testidPrefix ? `${testidPrefix}-${it.value ?? "all"}` : undefined
            }
            className={
              active
                ? "rounded-md bg-primary/15 px-3 py-1.5 text-sm font-medium text-primary-hover"
                : "rounded-md px-3 py-1.5 text-sm text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
            }
          >
            {it.label}
          </Link>
        );
      })}
    </div>
  );
}
