// src/app/(routes)/quality/_components/QualityTabs.tsx
// Tab switcher — links flip the ?tab= searchParam (same idiom as
// PromotionsTabs). Server component; the page re-renders for the active tab.
import Link from "next/link";
import { QUALITY_TABS, type QualityTab } from "@/lib/quality/types";

const LABELS: Record<QualityTab, string> = {
  services: "Service metrics",
  providers: "Provider metrics",
  "formula-configs": "Formula configs",
  anomalies: "Anomalies",
};

export default function QualityTabs({ active }: { active: QualityTab }) {
  return (
    <div
      className="inline-flex flex-wrap gap-0.5 rounded border border-zinc-200 bg-surface-1 p-0.5 text-sm"
      data-testid="quality-tabs"
    >
      {QUALITY_TABS.map((tab) => (
        <Link
          key={tab}
          href={`/quality?tab=${tab}`}
          data-testid={`quality-tab-${tab}`}
          data-active={tab === active}
          className={`rounded px-3 py-1 ${
            tab === active
              ? "bg-primary text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          {LABELS[tab]}
        </Link>
      ))}
    </div>
  );
}
