import type { AnalyticsTrendPoint } from "@/lib/traffic/types";

// Lightweight inline-SVG trend chart — the repo ships no chart library, and a
// two-series line over a daily window does not warrant one. Views and clicks
// are plotted on a shared y-scale (views dominate, so clicks ride near the
// floor — that's the intended visual: CTR is read from the table, not the eye).
export default function TrendSparkline({
  series,
  height = 80,
}: {
  series: AnalyticsTrendPoint[];
  height?: number;
}) {
  if (series.length === 0) {
    return (
      <div
        data-testid="trend-empty"
        className="flex items-center justify-center rounded border border-dashed border-zinc-200 text-xs text-zinc-400"
        style={{ height }}
      >
        No traffic in this window
      </div>
    );
  }

  const W = 600;
  const H = height;
  const PAD = 4;
  const maxY = Math.max(1, ...series.map((p) => Math.max(p.views, p.clicks)));
  const stepX =
    series.length > 1 ? (W - PAD * 2) / (series.length - 1) : 0;

  const toPoints = (key: "views" | "clicks"): string =>
    series
      .map((p, i) => {
        const x = PAD + i * stepX;
        const y = H - PAD - (p[key] / maxY) * (H - PAD * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <svg
      data-testid="trend-sparkline"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: H }}
      role="img"
      aria-label="Views and clicks trend"
    >
      <polyline
        points={toPoints("views")}
        fill="none"
        stroke="#2563eb"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={toPoints("clicks")}
        fill="none"
        stroke="#16a34a"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
