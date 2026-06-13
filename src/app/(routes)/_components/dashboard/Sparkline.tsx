"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import type { SeriesPoint } from "@/lib/dashboard/metrics";

/**
 * Minimal trend shape — no axes, no labels, no grid. Just the line of a
 * metric's recent history. Renders nothing below two points (a sparkline of one
 * point is noise).
 */
export default function Sparkline({
  data,
  color = "#5e6ad2",
  height = 40,
}: {
  data: SeriesPoint[];
  color?: string;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const gradientId = `spark-${color.replace("#", "")}`;
  return (
    <div style={{ height }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
