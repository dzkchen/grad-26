import { getStatsAggregates } from "@/lib/data/stats";
import { StatsLockedNotice, StatsView } from "@/components/stats/StatsView";

export const metadata = {
  title: "Stats — Class of 2026",
};

const MIN_SUBMISSIONS = 5;

export default async function StatsPage() {
  const data = await getStatsAggregates();

  if (data.total_submissions < MIN_SUBMISSIONS) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <StatsLockedNotice totalSubmissions={data.total_submissions} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <StatsView data={data} />
    </div>
  );
}
