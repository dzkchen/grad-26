"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type DonutDatum = {
  label: string;
  count: number;
  color: string;
};

export type ChoiceDonutChartProps = {
  data: DonutDatum[];
  ariaLabel: string;
};

export function ChoiceDonutChart({ data, ariaLabel }: ChoiceDonutChartProps) {
  return (
    <div className="h-56 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="50%"
            outerRadius="80%"
            paddingAngle={1}
            cornerRadius={2}
            isAnimationActive="auto"
          >
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [value, name]}
            contentStyle={{
              background: "var(--background)",
              border: "1px solid rgba(127,127,127,0.3)",
              color: "var(--foreground)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
