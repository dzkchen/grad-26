import Link from "next/link";
import {
  ChoiceDonutChart,
  type DonutDatum,
} from "@/components/charts/ChoiceDonutChart";
import type {
  Aggregate,
  ChoiceAggregate,
  NumericAggregate,
  StatsAggregates,
  TextAggregate,
} from "@/lib/data/stats";

const DONUT_COLORS = [
  "#1E6FD9",
  "#5B9EE8",
  "#0D1B4B",
  "#3A82C4",
  "#A8C8F0",
  "#C0CADE",
];
const BAR_COLORS = [
  "#1E6FD9",
  "#1E6FD9",
  "#5B9EE8",
  "#5B9EE8",
  "#A8C8F0",
  "#A8C8F0",
  "#C0CADE",
  "#DDE2F0",
];
const GRADE_BAR_COLORS: Record<string, string> = {
  "100": "#0D1B4B",
  "90-99": "#1E6FD9",
  "80-89": "#5B9EE8",
  "70-79": "#A8C8F0",
  "<70": "#DDE2F0",
};
const FINAL_GRADE_ORDER = ["100", "90-99", "80-89", "70-79", "<70"];
const QUOTE_ROTATIONS = [
  -1.5, 1, -0.5, 2, -1, 1.5, -2, 0.5, -1.5, 2, -0.5, 1, -2, 1.5, -1,
];

type RankedEntry = {
  label: string;
  count: number;
  percent: number;
};

export function StatsView({ data }: { data: StatsAggregates }) {
  const { total_submissions, aggregates } = data;

  return (
    <div className="jf-stats">
      <header className="jf-stats-header">
        <div>
          <p className="jf-stats-eyebrow">Fraser &apos;26 · Class Profile</p>
          <h1 className="jf-stats-title">
            BY THE
            <br />
            <span>NUMBERS.</span>
          </h1>
          <p className="jf-stats-sub">What the class actually looked like.</p>
        </div>
        <div>
          <div className="jf-stats-count">{total_submissions}</div>
          <div className="jf-stats-count-label">
            Survey {total_submissions === 1 ? "Response" : "Responses"}
          </div>
        </div>
      </header>

      <div className="jf-stats-grid">
        <SectionBreak label="Post-Secondary Plans" />
        <DonutCard
          cardLabel="What's Next After Graduation?"
          cardTitle="Where We're Headed"
          colClass="jf-stats-card-5"
          aggregate={aggregates.whats_next}
          questionId="whats_next"
        />
        <BarsCard
          cardLabel="Where you're going / working"
          cardTitle="Top Destinations"
          colClass="jf-stats-card-7"
          aggregate={aggregates.school_workplace}
          questionId="school_workplace"
          limit={5}
        />
        <BarsCard
          cardLabel="Program / Major"
          cardTitle="Top Fields of Study"
          colClass="jf-stats-card-6"
          aggregate={aggregates.program_major}
          questionId="program_major"
          limit={5}
        />
        <BarsCard
          cardLabel="Specialized Program"
          cardTitle="AP & SHSM"
          colClass="jf-stats-card-3"
          aggregate={aggregates.specialized_program}
          questionId="specialized_program"
        />
        <BarsCard
          cardLabel="Pronouns"
          cardTitle="How We ID"
          colClass="jf-stats-card-3"
          aggregate={aggregates.pronouns}
          questionId="pronouns"
        />

        <SectionBreak label="Academic Life" />
        <GaugeCard
          cardLabel="Average Sleep Per Night"
          cardTitle="average sleep"
          colClass="jf-stats-card-4"
          aggregate={aggregates.avg_sleep}
          unit="h"
          accent="#1E6FD9"
          max={10}
        />
        <GaugeCard
          cardLabel="Average Stress Level Senior Year"
          cardTitle="stress"
          colClass="jf-stats-card-4"
          aggregate={aggregates.stress}
          suffix="/10"
          accent="#5B9EE8"
          max={10}
        />
        <BigNumberCard
          cardLabel="Study Hours Per Week"
          cardTitle="study hours"
          colClass="jf-stats-card-4"
          aggregate={aggregates.study_hours}
          unit="h"
          caption="average / week"
        />
        <BarsCard
          cardLabel="Sem 2 Midterm Average"
          cardTitle="Midterm Distribution"
          colClass="jf-stats-card-4"
          aggregate={aggregates.final_grade_bucket}
          questionId="final_grade_bucket"
          thickBar
        />

        <div className="jf-stats-stack jf-stats-stack-4">
          <BigNumberCard
            cardLabel="Daily Screen Time"
            cardTitle="screen time"
            aggregate={aggregates.screen_time}
            unit="h"
            caption="hours / day"
          />
          <ChipCard
            cardLabel="Favourite Course"
            cardTitle="Top Picks"
            aggregate={aggregates.top_courses}
            questionId="top_courses"
            limit={12}
          />
        </div>

        <div className="jf-stats-stack jf-stats-stack-4">
          <ChipCard
            cardLabel="Most Difficult Course"
            cardTitle="The Toughest"
            aggregate={aggregates.hardest_course}
            questionId="hardest_course"
            limit={8}
          />
          <SignoffCard />
        </div>

        <SectionBreak label="The Class of '26" />
        <BarsCard
          cardLabel="What's one thing that defined the Class of '26?"
          cardTitle="How We Defined Ourselves"
          colClass="jf-stats-card-4"
          aggregate={aggregates.class_defined}
          questionId="class_defined"
        />
        <BarsCard
          cardLabel="What will you miss most?"
          cardTitle="What We'll Miss"
          colClass="jf-stats-card-4"
          aggregate={aggregates.miss_most}
          questionId="miss_most"
        />
        <BarsCard
          cardLabel="If you could relive ONE high school event…"
          cardTitle="The One Event"
          colClass="jf-stats-card-4"
          aggregate={aggregates.relive_event}
          questionId="relive_event"
        />

        <SectionBreak label="Looking Forward" />
        <BarsCard
          cardLabel="What are you MOST excited for after high school?"
          cardTitle="Most Excited For"
          colClass="jf-stats-card-6"
          aggregate={aggregates.excited_for}
          questionId="excited_for"
        />
        <BarsCard
          cardLabel="Where do you see yourself in 10 years?"
          cardTitle="Ten Years From Now"
          colClass="jf-stats-card-6"
          aggregate={aggregates.ten_years}
          questionId="ten_years"
        />

        <SectionBreak label="In Your Words" />
        <QuoteCard
          cardLabel="Advice to Your Grade 9 Self"
          cardTitle="What We'd Tell Ourselves"
          aggregate={aggregates.advice_grade9}
          limit={14}
        />
      </div>

      <section className="jf-stats-cta">
        <div>
          <div className="jf-stats-cta-title">
            Add your <span>numbers.</span>
          </div>
          <div className="jf-stats-cta-sub">
            The senior survey takes 5 minutes. Help finish the picture.
          </div>
        </div>
        <Link href="/survey" className="jf-stats-cta-btn">
          Take the Survey →
        </Link>
      </section>
    </div>
  );
}

function SectionBreak({ label }: { label: string }) {
  return (
    <div className="jf-stats-section-break">
      <span className="jf-stats-section-break-text">{label}</span>
      <div className="jf-stats-section-break-line" />
    </div>
  );
}

function DonutCard({
  cardLabel,
  cardTitle,
  colClass,
  aggregate,
  questionId,
}: {
  cardLabel: string;
  cardTitle: string;
  colClass: string;
  aggregate: Aggregate | undefined;
  questionId: string;
}) {
  if (!isChoiceAggregate(aggregate)) return null;
  const entries = choiceEntries(questionId, aggregate);
  if (entries.every((e) => e.count === 0)) return null;

  const donutData: DonutDatum[] = entries
    .filter((e) => e.count > 0)
    .map((entry, i) => ({
      label: entry.label,
      count: entry.count,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    }));
  const ariaLabel = `${cardLabel}: ${entries
    .map((e) => `${e.label} ${roundPct(e.percent)} percent`)
    .join(", ")}.`;

  return (
    <div className={`jf-stats-card ${colClass}`}>
      <div className="jf-stats-card-label">{cardLabel}</div>
      <div className="jf-stats-card-title">{cardTitle}</div>
      <div className="jf-stats-donut-wrap">
        <div className="jf-stats-donut-chart">
          <ChoiceDonutChart data={donutData} ariaLabel={ariaLabel} />
        </div>
        <div className="jf-stats-donut-legend">
          {entries.map((entry, i) => (
            <div className="jf-stats-legend-row" key={entry.label}>
              <span
                className="jf-stats-legend-dot"
                style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                aria-hidden
              />
              <span className="jf-stats-legend-label">{entry.label}</span>
              <span className="jf-stats-legend-val">
                {roundPct(entry.percent)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarsCard({
  cardLabel,
  cardTitle,
  colClass,
  aggregate,
  questionId,
  limit,
  thickBar,
}: {
  cardLabel: string;
  cardTitle: string;
  colClass: string;
  aggregate: Aggregate | undefined;
  questionId: string;
  limit?: number;
  thickBar?: boolean;
}) {
  if (!aggregate) return null;

  let entries: RankedEntry[];
  if (isChoiceAggregate(aggregate)) {
    entries = choiceEntries(questionId, aggregate, limit);
  } else if (isTextAggregate(aggregate)) {
    entries = textEntries(questionId, aggregate, limit);
  } else {
    return null;
  }

  if (entries.length === 0 || entries.every((e) => e.count === 0)) return null;

  const ariaLabel = `${cardLabel}: ${entries
    .map((e) => `${e.label} ${roundPct(e.percent)} percent`)
    .join(", ")}.`;

  return (
    <div className={`jf-stats-card ${colClass}`}>
      <div className="jf-stats-card-label">{cardLabel}</div>
      <div className="jf-stats-card-title">{cardTitle}</div>
      <div className="jf-stats-hbars" role="img" aria-label={ariaLabel}>
        {entries.map((entry, i) => {
          const fillColor =
            questionId === "final_grade_bucket"
              ? GRADE_BAR_COLORS[entry.label] ?? BAR_COLORS[0]
              : BAR_COLORS[Math.min(i, BAR_COLORS.length - 1)];
          return (
            <div key={entry.label}>
              <div className="jf-stats-hbar-top">
                <span className="jf-stats-hbar-name">{entry.label}</span>
                <span className="jf-stats-hbar-val">
                  {roundPct(entry.percent)}%
                </span>
              </div>
              <div
                className={`jf-stats-hbar-track${thickBar ? " jf-stats-hbar-track--thick" : ""}`}
              >
                <div
                  className="jf-stats-hbar-fill"
                  style={{
                    width: `${barWidth(entry.percent, entry.count)}%`,
                    background: fillColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GaugeCard({
  cardLabel,
  cardTitle,
  colClass,
  aggregate,
  unit,
  suffix,
  accent,
  max,
}: {
  cardLabel: string;
  cardTitle: string;
  colClass: string;
  aggregate: Aggregate | undefined;
  unit?: string;
  suffix?: string;
  accent: string;
  max: number;
}) {
  if (!isNumericAggregate(aggregate)) return null;
  const progress = clamp01(aggregate.mean / max);
  const offset = (188 * (1 - progress)).toFixed(1);
  const ariaLabel = `${cardLabel}: average ${formatDecimal(aggregate.mean)}${unit ?? ""}${suffix ?? ""}, ${aggregate.count} responses.`;

  return (
    <div className={`jf-stats-card ${colClass}`}>
      <div className="jf-stats-card-label">{cardLabel}</div>
      <div className="jf-stats-card-title">{cardTitle}</div>
      <div className="jf-stats-gauge" role="img" aria-label={ariaLabel}>
        <svg width="140" height="80" viewBox="0 0 140 80">
          <path
            d="M 10 75 A 60 60 0 0 1 130 75"
            fill="none"
            stroke="#EEF1F8"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 10 75 A 60 60 0 0 1 130 75"
            fill="none"
            stroke={accent}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray="188"
            strokeDashoffset={offset}
          />
        </svg>
        <div className="jf-stats-gauge-val">
          {formatDecimal(aggregate.mean)}
          {unit ? <span className="jf-stats-gauge-unit">{unit}</span> : null}
          {suffix ? (
            <span className="jf-stats-gauge-unit">{suffix}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BigNumberCard({
  cardLabel,
  cardTitle,
  colClass,
  aggregate,
  unit,
  caption,
}: {
  cardLabel: string;
  cardTitle: string;
  colClass?: string;
  aggregate: Aggregate | undefined;
  unit: string;
  caption: string;
}) {
  if (!isNumericAggregate(aggregate)) return null;

  return (
    <div className={`jf-stats-card${colClass ? ` ${colClass}` : ""}`}>
      <div className="jf-stats-card-label">{cardLabel}</div>
      <div className="jf-stats-card-title">{cardTitle}</div>
      <div className="jf-stats-bignum">
        {formatDecimal(aggregate.mean)}
        <span className="jf-stats-bignum-unit">{unit}</span>
      </div>
      <div className="jf-stats-bignum-caption">{caption}</div>
    </div>
  );
}

function ChipCard({
  cardLabel,
  cardTitle,
  aggregate,
  questionId,
  limit,
}: {
  cardLabel: string;
  cardTitle: string;
  aggregate: Aggregate | undefined;
  questionId: string;
  limit?: number;
}) {
  if (!isTextAggregate(aggregate)) return null;
  const entries = textEntries(questionId, aggregate, limit);
  if (entries.length === 0) return null;

  const max = entries[0]?.count ?? 1;
  const ariaLabel = `${cardLabel}: ${entries
    .map((e) => `${e.label} ${e.count}`)
    .join(", ")}.`;

  return (
    <div className="jf-stats-card">
      <div className="jf-stats-card-label">{cardLabel}</div>
      <div className="jf-stats-card-title">{cardTitle}</div>
      <div className="jf-stats-tags" role="img" aria-label={ariaLabel}>
        {entries.map((entry, i) => {
          const tier = i === 0 ? 5 : chipTier(entry.count, max);
          return (
            <span
              key={entry.label}
              className={`jf-stats-tag jf-stats-tag-${tier}`}
            >
              {entry.label}
              <span className="jf-stats-tag-count">{entry.count}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function QuoteCard({
  cardLabel,
  cardTitle,
  aggregate,
  limit = 14,
}: {
  cardLabel: string;
  cardTitle: string;
  aggregate: Aggregate | undefined;
  limit?: number;
}) {
  if (!isTextAggregate(aggregate)) return null;
  const notes = aggregate.values.slice(0, limit);
  if (notes.length === 0) return null;
  const ariaLabel = `${cardLabel}: ${notes.map((e) => e.value).join("; ")}.`;

  return (
    <div className="jf-stats-card jf-stats-card-12">
      <div className="jf-stats-card-label">{cardLabel}</div>
      <div className="jf-stats-card-title">{cardTitle}</div>
      <div className="jf-stats-quotes" role="img" aria-label={ariaLabel}>
        {notes.map((entry, i) => (
          <span
            key={`${entry.value}-${i}`}
            className="jf-stats-quote"
            style={
              {
                ["--qr" as string]: `${QUOTE_ROTATIONS[i % QUOTE_ROTATIONS.length]}deg`,
              } as React.CSSProperties
            }
          >
            &ldquo;{entry.value}&rdquo;
          </span>
        ))}
      </div>
    </div>
  );
}

function SignoffCard() {
  return (
    <div className="jf-stats-card jf-stats-signoff">
      <div className="jf-stats-signoff-text">
        We
        <br />
        MADE IT!!!!!
      </div>
    </div>
  );
}

function choiceEntries(
  questionId: string,
  aggregate: ChoiceAggregate,
  limit?: number,
): RankedEntry[] {
  const total = aggregate.order.reduce(
    (sum, c) => sum + (aggregate.choices[c] ?? 0),
    0,
  );
  const order =
    questionId === "final_grade_bucket" ? FINAL_GRADE_ORDER : aggregate.order;
  const entries = order.map((choice) => {
    const count = aggregate.choices[choice] ?? 0;
    return {
      label: readableChoice(choice),
      count,
      percent: percent(count, total),
    };
  });
  const sorted =
    questionId === "final_grade_bucket" ? entries : sortRanked(entries);
  return sorted.slice(0, limit ?? sorted.length);
}

function textEntries(
  questionId: string,
  aggregate: TextAggregate,
  limit?: number,
): RankedEntry[] {
  const grouped = new Map<string, number>();
  for (const entry of aggregate.values) {
    const label =
      questionId === "program_major"
        ? fieldOfStudyLabel(entry.value)
        : questionId === "school_workplace"
          ? destinationLabel(entry.value)
          : readableText(entry.value);
    grouped.set(label, (grouped.get(label) ?? 0) + entry.count);
  }
  const entries = Array.from(grouped, ([label, count]) => ({
    label,
    count,
    percent: percent(count, aggregate.count),
  }));
  const sorted = sortRanked(entries);

  if (questionId === "program_major") {
    const other = sorted.find((e) => e.label === "Other" && e.count > 0);
    const rest = sorted.filter((e) => e !== other);
    const cap = limit ?? sorted.length;
    const head = other ? rest.slice(0, Math.max(0, cap - 1)) : rest.slice(0, cap);
    return other ? [...head, other] : head;
  }

  return sorted.slice(0, limit ?? sorted.length);
}

function sortRanked(entries: RankedEntry[]) {
  return [...entries].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
}

function fieldOfStudyLabel(value: string) {
  const key = normalizeKey(value);

  if (
    hasAny(key, [
      "software",
      "computer science",
      "computer programming",
      "programming",
      "data science",
      "cybersecurity",
      "information technology",
      "artificial intelligence",
      "computer engineering",
    ])
  ) {
    return "Computer Science / Software";
  }
  if (
    hasAny(key, [
      "health",
      "medical",
      "medicine",
      "nursing",
      "biomed",
      "biology",
      "life science",
      "kinesiology",
      "pharmacy",
      "dentistry",
      "dental",
      "paramedic",
      "midwifery",
      "nutrition",
      "therapy",
      "optometry",
      "veterinary",
    ])
  ) {
    return "Health Sciences / Med";
  }
  if (
    hasAny(key, [
      "business",
      "commerce",
      "accounting",
      "finance",
      "marketing",
      "management",
      "economics",
      "entrepreneurship",
      "human resources",
      "supply chain",
      "real estate",
      "hospitality",
    ])
  ) {
    return "Business / Commerce";
  }
  if (
    hasAny(key, [
      "engineering",
      "architecture",
      "construction",
      "automotive",
      "aviation",
      "electrical",
      "hvac",
      "plumbing",
      "welding",
      "carpentry",
      "mechanical technician",
    ])
  ) {
    return "Engineering";
  }
  if (
    hasAny(key, [
      "english",
      "history",
      "art",
      "design",
      "philosophy",
      "communications",
      "journalism",
      "media",
      "linguistics",
      "anthropology",
      "sociology",
      "political",
      "international",
      "criminology",
      "law",
      "education",
      "social work",
      "music",
      "drama",
    ])
  ) {
    return "Arts & Humanities";
  }
  if (
    hasAny(key, [
      "math",
      "statistics",
      "physics",
      "chemistry",
      "environmental",
      "science",
    ])
  ) {
    return "Science / Math";
  }

  return "Other";
}

function destinationLabel(value: string) {
  const aliases: Record<string, string> = {
    waterloo: "University of Waterloo",
    "university of waterloo": "University of Waterloo",
    mcmaster: "McMaster University",
    "mcmaster university": "McMaster University",
    "toronto u of t": "University of Toronto",
    toronto: "University of Toronto",
    uoft: "University of Toronto",
    "u of t": "University of Toronto",
    "university of toronto": "University of Toronto",
    western: "Western University",
    "western university": "Western University",
    queens: "Queen's University",
    "queen s": "Queen's University",
    "queen s university": "Queen's University",
    ottawa: "University of Ottawa",
    uottawa: "University of Ottawa",
    laurier: "Wilfrid Laurier University",
    "wilfrid laurier": "Wilfrid Laurier University",
    york: "York University",
    guelph: "University of Guelph",
    carleton: "Carleton University",
    brock: "Brock University",
    windsor: "University of Windsor",
    seneca: "Seneca College",
    humber: "Humber College",
    centennial: "Centennial College",
    "george brown": "George Brown College",
    sheridan: "Sheridan College",
    fanshawe: "Fanshawe College",
    algonquin: "Algonquin College",
    conestoga: "Conestoga College",
    mohawk: "Mohawk College",
    niagara: "Niagara College",
    durham: "Durham College",
  };
  const key = normalizeKey(value);
  return aliases[key] ?? readableText(value);
}

function hasAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function readableText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function readableChoice(value: string) {
  return readableText(value).replace(/\//g, " / ").replace(/\s+/g, " ");
}

function percent(count: number, total: number) {
  return total > 0 ? (count / total) * 100 : 0;
}

function roundPct(value: number) {
  return Math.round(value);
}

function barWidth(value: number, count: number) {
  if (count <= 0) return 0;
  return Math.max(2, Math.min(value, 100));
}

function formatDecimal(value: number) {
  const r = Math.round(value * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function chipTier(count: number, max: number): 1 | 2 | 3 | 4 | 5 {
  if (max <= 0) return 1;
  const ratio = count / max;
  if (ratio >= 0.85) return 5;
  if (ratio >= 0.55) return 4;
  if (ratio >= 0.3) return 3;
  if (ratio >= 0.15) return 2;
  return 1;
}

function isNumericAggregate(
  a: Aggregate | undefined,
): a is NumericAggregate {
  return a !== undefined && (a.type === "scale_1_10" || a.type === "number");
}

function isChoiceAggregate(
  a: Aggregate | undefined,
): a is ChoiceAggregate {
  return (
    a !== undefined && (a.type === "single_choice" || a.type === "multi_choice")
  );
}

function isTextAggregate(
  a: Aggregate | undefined,
): a is TextAggregate {
  return (
    a !== undefined && (a.type === "short_text" || a.type === "long_text")
  );
}
