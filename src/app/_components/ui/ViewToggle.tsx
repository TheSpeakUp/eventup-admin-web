import Link from "next/link";
import Icon, { type IconName } from "./Icon";

// Table ⇄ Grid view switch for list pages. Server-rendered segmented links that
// flip a `?view=` param (default = table) while preserving the other filters and
// resetting the page cursor — the grid view accumulates from page one. Kept as
// links (not a client toggle) so the choice is shareable and SSR-correct.
export type ListView = "table" | "grid";

export function parseView(value: string | string[] | undefined): ListView {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "grid" ? "grid" : "table";
}

export default function ViewToggle({
  current,
  basePath,
  searchParams = {},
  resetParams = ["last_id", "offset"],
  testidPrefix = "view",
  multiParams = [],
}: {
  current: ListView;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  // Repeated params (e.g. a multi-value `queue_status`) the scalar
  // `searchParams` map can't express — appended as-is so the toggle preserves
  // them across a view switch.
  multiParams?: Array<[string, string]>;
  resetParams?: string[];
  testidPrefix?: string;
}) {
  function href(view: ListView): string {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "view") sp.set(k, v);
    }
    for (const [k, v] of multiParams) {
      if (v && k !== "view") sp.append(k, v);
    }
    for (const p of resetParams) sp.delete(p);
    if (view === "grid") sp.set("view", "grid");
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const items: { view: ListView; label: string; icon: IconName }[] = [
    { view: "table", label: "Table", icon: "table" },
    { view: "grid", label: "Grid", icon: "grid" },
  ];

  return (
    <div
      role="tablist"
      aria-label="View mode"
      className="inline-flex overflow-hidden rounded-md border border-hairline"
    >
      {items.map((it) => {
        const active = it.view === current;
        return (
          <Link
            key={it.view}
            href={href(it.view)}
            role="tab"
            aria-selected={active}
            data-testid={`${testidPrefix}-${it.view}`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors ${
              active
                ? "bg-primary text-white"
                : "bg-surface-2 text-ink-subtle hover:text-ink"
            }`}
          >
            <Icon name={it.icon} size={13} />
            {it.label}
          </Link>
        );
      })}
    </div>
  );
}
