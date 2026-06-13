"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ContentGrowthBucket, Granularity } from "@/lib/dashboard/types";
import { formatAxisDate } from "@/lib/dashboard/format";

const SERIES = [
  { key: "new_providers", name: "Providers", color: "#5e6ad2" },
  { key: "new_services", name: "Services", color: "#5dcaa5" },
  { key: "new_offers", name: "Offers", color: "#ef9f27" },
] as const;

export default function ContentGrowthChart({
  buckets,
  granularity = "day",
}: {
  buckets: ContentGrowthBucket[];
  granularity?: Granularity;
}) {
  if (!buckets || buckets.length === 0) {
    return (
      <div
        data-testid="content-growth-chart-empty"
        className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-hairline text-sm text-ink-subtle"
      >
        No growth data for the selected range
      </div>
    );
  }

  const data = [...buckets].sort((a, b) => a.period.localeCompare(b.period));

  return (
    <div
      data-testid="content-growth-chart"
      className="rounded-lg border border-hairline bg-surface-1 p-4"
    >
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#23252a" vertical={false} />
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
            width={36}
            allowDecimals={false}
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
          />
          <Legend
            iconType="plainline"
            wrapperStyle={{ fontSize: 12, color: "#8a8f98" }}
          />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
