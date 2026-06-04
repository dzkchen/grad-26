"use client";

import dynamic from "next/dynamic";
import type { ChoiceDonutChartProps } from "@/components/charts/ChoiceDonutChart";

const DynamicChoiceDonutChart = dynamic(
  () =>
    import("@/components/charts/ChoiceDonutChart").then(
      (mod) => mod.ChoiceDonutChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-56 w-full jf-skeleton"
        role="status"
        aria-label="Loading chart"
      />
    ),
  },
);

export function LazyChoiceDonutChart(props: ChoiceDonutChartProps) {
  return <DynamicChoiceDonutChart {...props} />;
}
