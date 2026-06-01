import { getStatsAggregates } from "@/lib/data/stats";
import { StatsView } from "@/components/stats/StatsView";

export const metadata = {
  title: "Stats — Class of 2026",
};

export default async function StatsPage() {
  const data = await getStatsAggregates();
  return <StatsView data={data} />;
}
