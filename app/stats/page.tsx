import { getStatsAggregates } from "@/lib/data/stats";
import { StatsView } from "@/components/stats/StatsView";

export const metadata = {
  title: "Stats — Class of 2026",
  description:
    "Aggregated senior-survey results for the Fraser Class of 2026 — the class by the numbers.",
};

export default async function StatsPage() {
  const data = await getStatsAggregates();
  return <StatsView data={data} />;
}
