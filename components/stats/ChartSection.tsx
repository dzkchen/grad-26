import {
  ChoiceDonutChart,
  type DonutDatum,
} from "@/components/charts/ChoiceDonutChart";
import type {
  Aggregate,
  ChoiceAggregate,
  NumericAggregate,
  TextAggregate,
} from "@/lib/data/stats";

export type StatsVisual = "donut" | "bars" | "gauge" | "metric" | "chips" | "notes";

export type ChartSectionProps = {
  questionId: string;
  label: string;
  aggregate: Aggregate;
  visual: StatsVisual;
  title?: string;
  kicker?: string;
  limit?: number;
  className?: string;
};

type RankedEntry = {
  label: string;
  count: number;
  percent: number;
};

const CHART_COLORS = [
  "#2563eb",
  "#60a5fa",
  "#0f1b4d",
  "#3b82f6",
  "#93c5fd",
  "#cbd5e1",
  "#e2e8f0",
];

const FINAL_GRADE_ORDER = ["100", "90-99", "80-89", "70-79", "<70"];

export function ChartSection({
  questionId,
  label,
  aggregate,
  visual,
  title,
  kicker,
  limit,
  className = "",
}: ChartSectionProps) {
  const headingId = `stat-${questionId}`;
  const displayTitle = title ?? label;

  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-lg border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-zinc-950 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {kicker ?? label}
      </p>
      <h2
        id={headingId}
        className="mt-2 text-xl font-black uppercase tracking-tight text-slate-950 dark:text-white"
      >
        {displayTitle}
      </h2>
      {renderBody({ questionId, label, aggregate, visual, limit })}
    </section>
  );
}

function renderBody({
  questionId,
  label,
  aggregate,
  visual,
  limit,
}: {
  questionId: string;
  label: string;
  aggregate: Aggregate;
  visual: StatsVisual;
  limit?: number;
}) {
  switch (visual) {
    case "donut":
      if (!isChoiceAggregate(aggregate)) return null;
      return <DonutSection label={label} aggregate={aggregate} limit={limit} />;
    case "bars":
      if (isChoiceAggregate(aggregate)) {
        return (
          <RankedBars
            label={label}
            entries={choiceEntries(questionId, aggregate, limit)}
            valueLabel="Percent"
          />
        );
      }
      if (isTextAggregate(aggregate)) {
        return (
          <RankedBars
            label={label}
            entries={textEntries(questionId, aggregate, limit)}
            valueLabel="Percent"
          />
        );
      }
      return null;
    case "gauge":
      if (!isNumericAggregate(aggregate)) return null;
      return <GaugeStat questionId={questionId} label={label} aggregate={aggregate} />;
    case "metric":
      if (!isNumericAggregate(aggregate)) return null;
      return <MetricStat questionId={questionId} label={label} aggregate={aggregate} />;
    case "chips":
      if (!isTextAggregate(aggregate)) return null;
      return <ChipCloud label={label} entries={textEntries(questionId, aggregate, limit)} />;
    case "notes":
      if (!isTextAggregate(aggregate)) return null;
      return <NoteCloud label={label} aggregate={aggregate} limit={limit} />;
  }
}

function DonutSection({
  label,
  aggregate,
  limit,
}: {
  label: string;
  aggregate: ChoiceAggregate;
  limit?: number;
}) {
  const entries = choiceEntries("whats_next", aggregate, limit);
  const donutData: DonutDatum[] = entries
    .filter((entry) => entry.count > 0)
    .map((entry, index) => ({
      label: entry.label,
      count: entry.count,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  const ariaLabel = `${label}: ${entries
    .map((entry) => `${entry.label} ${roundPercent(entry.percent)} percent`)
    .join(", ")}.`;

  return (
    <>
      {donutData.length > 0 ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:items-center">
          <ChoiceDonutChart data={donutData} ariaLabel={ariaLabel} />
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div
                key={entry.label}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm"
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-slate-600 dark:text-slate-300">{entry.label}</span>
                <span className="font-black text-slate-950 dark:text-white">
                  {roundPercent(entry.percent)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <StatsTable
        caption={`${label} — count and percentage per choice`}
        valueHeader="Choice"
        rows={entries.map((entry) => ({
          label: entry.label,
          value: `${entry.count} (${roundPercent(entry.percent)}%)`,
        }))}
      />
    </>
  );
}

function RankedBars({
  label,
  entries,
  valueLabel,
}: {
  label: string;
  entries: RankedEntry[];
  valueLabel: string;
}) {
  const ariaLabel = `${label}: ${entries
    .map((entry) => `${entry.label} ${roundPercent(entry.percent)} percent`)
    .join(", ")}.`;

  return (
    <>
      <div className="mt-6 space-y-5" role="img" aria-label={ariaLabel}>
        {entries.map((entry, index) => (
          <div key={entry.label} className="space-y-2">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {entry.label}
              </span>
              <span className="text-base font-black text-slate-950 dark:text-white">
                {roundPercent(entry.percent)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${barWidth(entry.percent, entry.count)}%`,
                  backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <StatsTable
        caption={`${label} — count and percentage per entry`}
        valueHeader="Entry"
        rows={entries.map((entry) => ({
          label: entry.label,
          value: `${entry.count} (${roundPercent(entry.percent)}%)`,
        }))}
        countHeader={valueLabel}
      />
    </>
  );
}

function GaugeStat({
  questionId,
  label,
  aggregate,
}: {
  questionId: string;
  label: string;
  aggregate: NumericAggregate;
}) {
  const max = questionId === "stress" ? 10 : 10;
  const unit = questionId === "avg_sleep" ? "H" : "";
  const suffix = questionId === "stress" ? "/10" : "";
  const progress = Math.max(0, Math.min((aggregate.mean / max) * 100, 100));
  const ariaLabel = `${label}: average ${formatDecimal(aggregate.mean)}${unit}${suffix}, median ${aggregate.median}, ${aggregate.count} responses.`;

  return (
    <>
      <div className="mt-7 text-center" role="img" aria-label={ariaLabel}>
        <svg viewBox="0 0 200 118" className="mx-auto h-28 w-full max-w-72">
          <path
            d="M 28 98 A 72 72 0 0 1 172 98"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="18"
            className="text-slate-100 dark:text-slate-900"
            pathLength={100}
          />
          <path
            d="M 28 98 A 72 72 0 0 1 172 98"
            fill="none"
            stroke={questionId === "stress" ? "#60a5fa" : "#2563eb"}
            strokeLinecap="round"
            strokeWidth="18"
            pathLength={100}
            strokeDasharray={`${progress} 100`}
          />
        </svg>
        <div className="-mt-2 flex items-end justify-center gap-1 text-slate-950 dark:text-white">
          <span className="text-5xl font-black leading-none tracking-tight">
            {formatDecimal(aggregate.mean)}
          </span>
          {unit ? (
            <span className="pb-1 text-2xl font-black text-blue-500">{unit}</span>
          ) : null}
          {suffix ? (
            <span className="pb-1 text-2xl font-black text-blue-500">{suffix}</span>
          ) : null}
        </div>
        <p className="mt-2 text-sm italic text-slate-400">
          {questionId === "avg_sleep"
            ? "hours / night"
            : "stress rating"}
        </p>
      </div>
      <NumericTable label={label} aggregate={aggregate} />
    </>
  );
}

function MetricStat({
  questionId,
  label,
  aggregate,
}: {
  questionId: string;
  label: string;
  aggregate: NumericAggregate;
}) {
  const unit = questionId === "study_hours" || questionId === "screen_time" ? "H" : "";
  const sublabel = questionId === "study_hours" ? "average / week" : "hours / day";
  const ariaLabel = `${label}: average ${formatDecimal(aggregate.mean)}${unit}, median ${aggregate.median}, ${aggregate.count} responses.`;

  return (
    <>
      <div className="mt-8" role="img" aria-label={ariaLabel}>
        <div className="flex items-end gap-1 text-slate-950 dark:text-white">
          <span className="text-7xl font-black leading-none tracking-tight">
            {formatDecimal(aggregate.mean)}
          </span>
          {unit ? (
            <span className="pb-3 text-3xl font-black text-blue-500">{unit}</span>
          ) : null}
        </div>
        <p className="mt-4 text-sm italic text-slate-400">{sublabel}</p>
      </div>
      <NumericTable label={label} aggregate={aggregate} />
    </>
  );
}

function ChipCloud({ label, entries }: { label: string; entries: RankedEntry[] }) {
  const ariaLabel = `${label}: ${entries
    .map((entry) => `${entry.label} ${entry.count}`)
    .join(", ")}.`;

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2" role="img" aria-label={ariaLabel}>
        {entries.map((entry, index) => (
          <span
            key={entry.label}
            className={
              index === 0
                ? "rounded-full bg-slate-950 px-4 py-2 text-xl font-black text-white dark:bg-white dark:text-slate-950"
                : "rounded-full border border-blue-100 bg-slate-50 px-3 py-1.5 text-base font-bold text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            }
          >
            {entry.label}{" "}
            <span className={index === 0 ? "text-blue-400" : "text-blue-500"}>
              {entry.count}
            </span>
          </span>
        ))}
      </div>
      <StatsTable
        caption={`${label} — count per write-in`}
        valueHeader="Write-in"
        rows={entries.map((entry) => ({
          label: entry.label,
          value: String(entry.count),
        }))}
      />
    </>
  );
}

function NoteCloud({
  label,
  aggregate,
  limit = 14,
}: {
  label: string;
  aggregate: TextAggregate;
  limit?: number;
}) {
  const notes = aggregate.values.slice(0, limit);
  const colors = [
    "bg-yellow-100 text-slate-950",
    "bg-blue-100 text-slate-950",
    "bg-rose-100 text-slate-950",
    "bg-white text-slate-950",
  ];
  const ariaLabel = `${label}: ${notes.map((entry) => entry.value).join("; ")}.`;

  return (
    <>
      <div className="mt-7 flex flex-wrap gap-3" role="img" aria-label={ariaLabel}>
        {notes.map((entry, index) => (
          <span
            key={entry.value}
            className={`inline-block rounded-md px-4 py-2 text-sm italic shadow-sm ring-1 ring-black/5 ${colors[index % colors.length]}`}
            style={{ transform: `rotate(${noteRotation(index)}deg)` }}
          >
            &quot;{entry.value}&quot;
          </span>
        ))}
      </div>
      <StatsTable
        caption={`${label} — write-in responses`}
        valueHeader="Response"
        rows={notes.map((entry) => ({
          label: entry.value,
          value: String(entry.count),
        }))}
      />
    </>
  );
}

function NumericTable({
  label,
  aggregate,
}: {
  label: string;
  aggregate: NumericAggregate;
}) {
  return (
    <table className="sr-only">
      <caption>{label} — numeric summary and histogram</caption>
      <thead>
        <tr>
          <th scope="col">Value</th>
          <th scope="col">Count</th>
        </tr>
      </thead>
      <tbody>
        {aggregate.histogram.map((value, idx) => (
          <tr key={idx}>
            <td>{aggregate.bucket_min + idx}</td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Mean</th>
          <td>{aggregate.mean}</td>
        </tr>
        <tr>
          <th scope="row">Median</th>
          <td>{aggregate.median}</td>
        </tr>
        <tr>
          <th scope="row">Responses</th>
          <td>{aggregate.count}</td>
        </tr>
      </tfoot>
    </table>
  );
}

function StatsTable({
  caption,
  valueHeader,
  countHeader = "Count",
  rows,
}: {
  caption: string;
  valueHeader: string;
  countHeader?: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{valueHeader}</th>
          <th scope="col">{countHeader}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <td>{row.label}</td>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function choiceEntries(
  questionId: string,
  aggregate: ChoiceAggregate,
  limit?: number,
): RankedEntry[] {
  const total = aggregate.order.reduce(
    (sum, choice) => sum + (aggregate.choices[choice] ?? 0),
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
    questionId === "final_grade_bucket" ? entries : sortRankedEntries(entries);
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

  return sortRankedEntries(entries).slice(0, limit ?? entries.length);
}

function sortRankedEntries(entries: RankedEntry[]) {
  return [...entries].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label);
  });
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
  return readableText(value)
    .replace(/\//g, " / ")
    .replace(/\s+/g, " ");
}

function percent(count: number, total: number) {
  return total > 0 ? (count / total) * 100 : 0;
}

function roundPercent(value: number) {
  return Math.round(value);
}

function barWidth(value: number, count: number) {
  if (count <= 0) return 0;
  return Math.max(2, Math.min(value, 100));
}

function formatDecimal(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function noteRotation(index: number) {
  return [-1.5, 0.8, -0.8, 1.2, -1, 0.6][index % 6];
}

function isNumericAggregate(aggregate: Aggregate): aggregate is NumericAggregate {
  return aggregate.type === "scale_1_10" || aggregate.type === "number";
}

function isChoiceAggregate(aggregate: Aggregate): aggregate is ChoiceAggregate {
  return aggregate.type === "single_choice" || aggregate.type === "multi_choice";
}

function isTextAggregate(aggregate: Aggregate): aggregate is TextAggregate {
  return aggregate.type === "short_text" || aggregate.type === "long_text";
}
