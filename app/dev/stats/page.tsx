import { getStatsAggregates } from "@/lib/data/stats";
import { StatsView } from "@/components/stats/StatsView";

export const metadata = {
  title: "Stats (dev preview) — Class of 2026",
};

export default async function DevStatsPage() {
  const data = await getStatsAggregates(1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
        <strong>Dev preview.</strong> De-anonymization floor lowered to 1.
        Production <code>/stats</code> still requires 5 submissions.
      </div>
      <StatsView data={data} />
    </div>
  );
}
