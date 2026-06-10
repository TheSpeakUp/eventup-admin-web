// src/app/(routes)/quality/_components/AnomaliesFilter.tsx
// Reviewed / unreviewed filter for the anomalies tab. Submits via GET so the
// ?resolved= searchParam drives the server render (same idiom as OrdersFilter).
import Link from "next/link";

export default function AnomaliesFilter({
  resolved,
}: {
  resolved?: boolean;
}) {
  const current =
    resolved === undefined ? "all" : resolved ? "reviewed" : "unreviewed";
  const options: { key: string; label: string; href: string }[] = [
    { key: "all", label: "All", href: "/quality?tab=anomalies" },
    {
      key: "unreviewed",
      label: "Unreviewed",
      href: "/quality?tab=anomalies&resolved=false",
    },
    {
      key: "reviewed",
      label: "Reviewed",
      href: "/quality?tab=anomalies&resolved=true",
    },
  ];
  return (
    <div
      className="inline-flex gap-0.5 rounded border border-zinc-200 bg-white p-0.5 text-sm"
      data-testid="anomalies-filter"
    >
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.href}
          data-testid={`anomalies-filter-${o.key}`}
          data-active={o.key === current}
          className={`rounded px-3 py-1 ${
            o.key === current
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
