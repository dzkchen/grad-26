import { ChartSection } from "@/components/stats/ChartSection";
import { QUESTIONS } from "@/content/survey-questions";
import type { StatsAggregates } from "@/lib/data/stats";

export function StatsView({ data }: { data: StatsAggregates }) {
  const { total_submissions, aggregates } = data;

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-medium text-zinc-500">Class of 2026</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Stats
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Aggregated answers from {total_submissions}{" "}
          {total_submissions === 1 ? "submission" : "submissions"}. Free-text
          answers aren&apos;t included.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {QUESTIONS.map((q) => {
          const agg = aggregates[q.id];
          if (!agg) return null;
          return (
            <ChartSection
              key={q.id}
              questionId={q.id}
              label={q.label}
              aggregate={agg}
            />
          );
        })}
      </div>
    </>
  );
}

export function StatsLockedNotice({ totalSubmissions }: { totalSubmissions: number }) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-black/10 px-6 py-10 text-center dark:border-white/15">
      <h1 className="text-2xl font-semibold tracking-tight">Stats locked</h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        We need a few more submissions before stats unlock — this is to keep
        early submitters anonymous.
      </p>
      <p className="mt-4 text-sm text-zinc-500">
        {totalSubmissions} {totalSubmissions === 1 ? "submission" : "submissions"} so far.
      </p>
      <a
        href="/survey"
        className="mt-6 inline-block rounded-md border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
      >
        Fill out the survey
      </a>
    </div>
  );
}
