import {
  ChartSection,
  type StatsVisual,
} from "@/components/stats/ChartSection";
import { QUESTIONS } from "@/content/survey-questions";
import type { Aggregate, StatsAggregates } from "@/lib/data/stats";

type StatCard = {
  id: string;
  visual: StatsVisual;
  title: string;
  kicker: string;
  limit?: number;
  className?: string;
};

type StatGroup = {
  title: string;
  cards: StatCard[];
};

const STAT_GROUPS: StatGroup[] = [
  {
    title: "After Graduation",
    cards: [
      {
        id: "whats_next",
        visual: "donut",
        title: "Where We're Headed",
        kicker: "What's next after graduation?",
        className: "md:col-span-1",
      },
      {
        id: "school_workplace",
        visual: "bars",
        title: "Top Destinations",
        kicker: "Where you're going / working",
        limit: 5,
        className: "md:col-span-2",
      },
      {
        id: "program_major",
        visual: "bars",
        title: "Top Fields of Study",
        kicker: "Program / major",
        limit: 5,
        className: "md:col-span-2",
      },
      {
        id: "specialized_program",
        visual: "bars",
        title: "AP & SHSM",
        kicker: "Specialized program",
        limit: 3,
      },
      {
        id: "pronouns",
        visual: "bars",
        title: "How We ID",
        kicker: "Pronouns",
        limit: 5,
      },
    ],
  },
  {
    title: "Academic Life",
    cards: [
      {
        id: "avg_sleep",
        visual: "gauge",
        title: "Avg_Sleep",
        kicker: "Average sleep per night",
      },
      {
        id: "stress",
        visual: "gauge",
        title: "Stress",
        kicker: "Average stress level senior year",
      },
      {
        id: "study_hours",
        visual: "metric",
        title: "Study_Hours",
        kicker: "Study hours per week",
      },
      {
        id: "screen_time",
        visual: "metric",
        title: "Screen_Time",
        kicker: "Daily screen time",
      },
      {
        id: "final_grade_bucket",
        visual: "bars",
        title: "Midterm Distribution",
        kicker: "Sem 2 midterm average",
        className: "md:col-span-2",
      },
      {
        id: "top_courses",
        visual: "chips",
        title: "Top_Courses Write-In",
        kicker: "Favourite course",
        limit: 10,
      },
      {
        id: "hardest_course",
        visual: "chips",
        title: "Hardest_Course Write-In",
        kicker: "Most difficult course",
        limit: 10,
      },
    ],
  },
  {
    title: "The Class of '26",
    cards: [
      {
        id: "class_defined",
        visual: "bars",
        title: "How We Defined Ourselves",
        kicker: "What's one thing that defined the Class of '26?",
      },
      {
        id: "miss_most",
        visual: "bars",
        title: "What We'll Miss",
        kicker: "What will you miss most?",
      },
      {
        id: "relive_event",
        visual: "bars",
        title: "The One Event",
        kicker: "If you could relive one high school event...",
      },
    ],
  },
  {
    title: "Looking Forward",
    cards: [
      {
        id: "excited_for",
        visual: "bars",
        title: "Most Excited For",
        kicker: "What are you most excited for after high school?",
        className: "md:col-span-2",
      },
      {
        id: "ten_years",
        visual: "bars",
        title: "Ten Years From Now",
        kicker: "Where do you see yourself in 10 years?",
        className: "md:col-span-2",
      },
    ],
  },
  {
    title: "In Your Words",
    cards: [
      {
        id: "advice_grade9",
        visual: "notes",
        title: "What We'd Tell Ourselves",
        kicker: "Advice to your Grade 9 self",
        limit: 14,
        className: "md:col-span-4",
      },
    ],
  },
];

const QUESTIONS_BY_ID = new Map(QUESTIONS.map((question) => [question.id, question]));

export function StatsView({ data }: { data: StatsAggregates }) {
  const { total_submissions, aggregates } = data;

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-medium text-zinc-500">Class of 2026</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Stats</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Aggregated answers from {total_submissions}{" "}
          {total_submissions === 1 ? "submission" : "submissions"}. Text
          answers are grouped or sampled where shown.
        </p>
      </header>

      <div className="space-y-12">
        {STAT_GROUPS.map((group) => {
          const cards = group.cards.filter((card) =>
            shouldRenderCard(aggregates[card.id]),
          );
          if (cards.length === 0) return null;

          return (
            <section key={group.title} aria-labelledby={sectionId(group.title)}>
              <div className="mb-5 flex items-center gap-4">
                <h2
                  id={sectionId(group.title)}
                  className="text-sm font-black uppercase tracking-[0.24em] text-slate-400"
                >
                  {group.title}
                </h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                {cards.map((card) => {
                  const question = QUESTIONS_BY_ID.get(card.id);
                  const aggregate = aggregates[card.id];
                  if (!question || !aggregate) return null;

                  return (
                    <ChartSection
                      key={card.id}
                      questionId={card.id}
                      label={question.label}
                      aggregate={aggregate}
                      visual={card.visual}
                      title={card.title}
                      kicker={card.kicker}
                      limit={card.limit}
                      className={card.className ?? "md:col-span-1"}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

export function StatsLockedNotice({
  totalSubmissions,
}: {
  totalSubmissions: number;
}) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-black/10 px-6 py-10 text-center dark:border-white/15">
      <h1 className="text-2xl font-semibold tracking-tight">Stats locked</h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        We need a few more submissions before stats unlock — this is to keep
        early submitters anonymous.
      </p>
      <p className="mt-4 text-sm text-zinc-500">
        {totalSubmissions}{" "}
        {totalSubmissions === 1 ? "submission" : "submissions"} so far.
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

function shouldRenderCard(aggregate: Aggregate | undefined) {
  if (!aggregate) return false;
  switch (aggregate.type) {
    case "number":
    case "scale_1_10":
      return aggregate.count > 0;
    case "single_choice":
    case "multi_choice":
      return Object.values(aggregate.choices).some((count) => count > 0);
    case "short_text":
    case "long_text":
      return aggregate.count > 0;
  }
}

function sectionId(title: string) {
  return `stats-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
