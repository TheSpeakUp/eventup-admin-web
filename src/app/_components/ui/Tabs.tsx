import Link from "next/link";

// URL-driven segmented navigation. Each tab is a Link (server-rendered,
// shareable, back-button friendly) carrying the active styling. Used to split a
// page into responsibility zones instead of one long mixed scroll.
export type TabItem = { key: string; label: string; href: string };

export default function Tabs({
  items,
  current,
}: {
  items: TabItem[];
  current: string;
}) {
  return (
    <div
      role="tablist"
      className="flex gap-1 overflow-x-auto border-b border-hairline"
    >
      {items.map((t) => {
        const active = t.key === current;
        return (
          <Link
            key={t.key}
            href={t.href}
            role="tab"
            aria-selected={active}
            data-testid={`dashboard-tab-${t.key}`}
            className={
              active
                ? "-mb-px border-b-2 border-primary px-4 py-2 text-sm font-medium text-ink"
                : "-mb-px border-b-2 border-transparent px-4 py-2 text-sm text-ink-subtle transition-colors hover:text-ink"
            }
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
