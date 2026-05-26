"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type HistogramChartProps = {
  bucketMin: number;
  histogram: number[];
  ariaLabel: string;
  unitSuffix?: string;
};

export function HistogramChart({
  bucketMin,
  histogram,
  ariaLabel,
  unitSuffix,
}: HistogramChartProps) {
  const data = histogram.map((count, idx) => {
    const bucket = bucketMin + idx;
    return {
      bucket,
      bucketLabel: unitSuffix ? `${bucket}${unitSuffix}` : String(bucket),
      count,
    };
  });

  return (
    <div className="h-64 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
          <XAxis
            dataKey="bucketLabel"
            tick={{ fontSize: 12, fill: "currentColor" }}
            stroke="currentColor"
            opacity={0.6}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "currentColor" }}
            stroke="currentColor"
            opacity={0.6}
          />
          <Tooltip
            cursor={{ fill: "currentColor", opacity: 0.06 }}
            contentStyle={{
              background: "var(--background)",
              border: "1px solid rgba(127,127,127,0.3)",
              color: "var(--foreground)",
            }}
          />
          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
