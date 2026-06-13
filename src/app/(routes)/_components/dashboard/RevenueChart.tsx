"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { RevenueBucket } from "@/lib/dashboard/types";

export default function RevenueChart({ buckets }: { buckets: RevenueBucket[] }) {
  if (!buckets || buckets.length === 0) {
    return (
      <div
        data-testid="revenue-chart-empty"
        className="flex items-center justify-center rounded border border-dashed border-zinc-200 p-8 text-sm text-zinc-500"
      >
        No revenue data for the selected range
      </div>
    );
  }

  // Group buckets by period, then by resource_type
  const periodMap: Map<
    string,
    Map<string, { gross: number; count: number }>
  > = new Map();

  buckets.forEach((b) => {
    if (!periodMap.has(b.period)) {
      periodMap.set(b.period, new Map());
    }
    const resourceMap = periodMap.get(b.period)!;
    if (!resourceMap.has(b.resource_type)) {
      resourceMap.set(b.resource_type, { gross: 0, count: 0 });
    }
    const entry = resourceMap.get(b.resource_type)!;
    entry.gross += b.gross_minor;
    entry.count += 1;
  });

  // Build chart data: each period is one bar, with stacked sections per resource_type
  // For display, convert minor to major (divide by 100, assuming 2 decimals)
  const resourceTypes = new Set<string>();
  buckets.forEach((b) => resourceTypes.add(b.resource_type));

  const chartData = Array.from(periodMap.entries()).map(([period, resourceMap]) => {
    const entry: Record<string, number | string> = { period };
    resourceTypes.forEach((rt) => {
      const data = resourceMap.get(rt);
      // Convert minor to major (2 decimals)
      entry[rt] = data ? Math.round(data.gross / 100) / 100 : 0;
    });
    return entry;
  });

  // Colors for resource types (cycle through a palette)
  const colors = [
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
  ];

  const colorMap: Record<string, string> = {};
  Array.from(resourceTypes).forEach((rt, i) => {
    colorMap[rt] = colors[i % colors.length];
  });

  return (
    <div data-testid="revenue-chart" className="rounded border border-zinc-200 bg-surface-1 p-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#23252a" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12, fill: "#8a8f98" }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#8a8f98" }}
            label={{ value: "Amount (major units)", angle: -90, position: "insideLeft", fill: "#8a8f98" }}
          />
          <Tooltip
            cursor={{ fill: "#141516" }}
            contentStyle={{
              backgroundColor: "#0f1011",
              border: "1px solid #23252a",
              borderRadius: "0.5rem",
              color: "#f7f8f8",
            }}
            labelStyle={{ color: "#f7f8f8" }}
            itemStyle={{ color: "#d0d6e0" }}
          />
          <Legend />
          {Array.from(resourceTypes).map((rt) => (
            <Bar
              key={rt}
              dataKey={rt}
              stackId="revenue"
              fill={colorMap[rt]}
              name={rt}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
