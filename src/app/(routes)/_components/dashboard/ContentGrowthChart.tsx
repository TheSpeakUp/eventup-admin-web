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
import type { ContentGrowthBucket } from "@/lib/dashboard/types";

export default function ContentGrowthChart({
  buckets,
}: {
  buckets: ContentGrowthBucket[];
}) {
  if (!buckets || buckets.length === 0) {
    return (
      <div
        data-testid="content-growth-chart-empty"
        className="flex items-center justify-center rounded border border-dashed border-zinc-200 p-8 text-sm text-zinc-500"
      >
        No growth data for the selected range
      </div>
    );
  }

  const chartData = buckets.map((b) => ({
    period: b.period,
    new_providers: b.new_providers,
    new_services: b.new_services,
    new_offers: b.new_offers,
  }));

  return (
    <div data-testid="content-growth-chart" className="rounded border border-zinc-200 bg-surface-1 p-4">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
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
            label={{ value: "Count", angle: -90, position: "insideLeft", fill: "#8a8f98" }}
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
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="new_providers"
            stroke="#3b82f6"
            name="New Providers"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="new_services"
            stroke="#10b981"
            name="New Services"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="new_offers"
            stroke="#f59e0b"
            name="New Offers"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
