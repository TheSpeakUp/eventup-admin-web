"use client";

import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RevenueBucket, Granularity } from "@/lib/dashboard/types";
import { formatAxisDate, formatCompactMoney } from "@/lib/dashboard/format";
import { formatMoneyMinor } from "@/lib/format";

// Lavender-led series palette (primary first), then distinguishable hues that
// read on the dark canvas. Stacked area shows total revenue trend + the
// resource-type composition without the chartjunk of a stacked bar.
const SERIES_COLORS = [
  "#5e6ad2",
  "#5dcaa5",
  "#ef9f27",
  "#e24b4a",
  "#85b7eb",
  "#d4537e",
];

type ChartRow = { period: string } & Record<string, number | string>;

export default function RevenueChart({
  buckets,
  granularity = "day",
  currency,
}: {
  buckets: RevenueBucket[];
  granularity?: Granularity;
  currency?: string | null;
}) {
  if (!buckets || buckets.length === 0) {
    return (
      <div
        data-testid="revenue-chart-empty"
        className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-hairline text-sm text-ink-subtle"
      >
        No revenue data for the selected range
      </div>
    );
  }

  const cur = currency ?? buckets[0]?.currency ?? "USD";
  const rows = buckets.filter((b) => b.currency === cur);

  const resourceTypes = Array.from(
    new Set(rows.map((b) => b.resource_type)),
  );

  const byPeriod = new Map<string, ChartRow>();
  for (const b of rows) {
    const row = byPeriod.get(b.period) ?? { period: b.period };
    row[b.resource_type] =
      ((row[b.resource_type] as number) ?? 0) + b.gross_minor / 100;
    byPeriod.set(b.period, row);
  }
  const data = [...byPeriod.values()].sort((a, z) =>
    String(a.period).localeCompare(String(z.period)),
  );

  return (
    <div
      data-testid="revenue-chart"
      className="rounded-lg border border-hairline bg-surface-1 p-4"
    >
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {resourceTypes.map((rt, i) => (
              <linearGradient key={rt} id={`rev-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={SERIES_COLORS[i % SERIES_COLORS.length]}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={SERIES_COLORS[i % SERIES_COLORS.length]}
                  stopOpacity={0.02}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#23252a"
            vertical={false}
          />
          <XAxis
            dataKey="period"
            tickFormatter={(v: string) => formatAxisDate(v, granularity)}
            tick={{ fontSize: 11, fill: "#8a8f98" }}
            tickLine={false}
            axisLine={{ stroke: "#23252a" }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#8a8f98" }}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) =>
              formatCompactMoney(Math.round(v * 100), cur)
            }
          />
          <Tooltip
            cursor={{ stroke: "#34343a" }}
            contentStyle={{
              backgroundColor: "#0f1011",
              border: "1px solid #23252a",
              borderRadius: "0.5rem",
              color: "#f7f8f8",
            }}
            labelStyle={{ color: "#f7f8f8" }}
            itemStyle={{ color: "#d0d6e0" }}
            labelFormatter={(v) => formatAxisDate(String(v), granularity)}
            formatter={(value, name) => [
              formatMoneyMinor(Math.round(Number(value) * 100), cur),
              String(name),
            ]}
          />
          {resourceTypes.map((rt, i) => (
            <Area
              key={rt}
              type="monotone"
              dataKey={rt}
              name={rt}
              stackId="rev"
              stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
              strokeWidth={2}
              fill={`url(#rev-${i})`}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
