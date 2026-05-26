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

export type ChoiceBarChartProps = {
  choices: Record<string, number>;
  order: string[];
  ariaLabel: string;
};

export function ChoiceBarChart({ choices, order, ariaLabel }: ChoiceBarChartProps) {
  // Use the canonical question order as the tiebreaker for choices with equal counts.
  const orderIndex = new Map(order.map((c, i) => [c, i]));
  const data = order
    .map((choice) => ({ choice, count: choices[choice] ?? 0 }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return (orderIndex.get(a.choice) ?? 0) - (orderIndex.get(b.choice) ?? 0);
    });

  return (
    <div className="h-72 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "currentColor" }}
            stroke="currentColor"
            opacity={0.6}
          />
          <YAxis
            type="category"
            dataKey="choice"
            width={140}
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
          <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
