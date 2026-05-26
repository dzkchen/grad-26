import { HistogramChart } from "@/components/charts/HistogramChart";
import { ChoiceBarChart } from "@/components/charts/ChoiceBarChart";
import type { Aggregate } from "@/lib/data/stats";

export function ChartSection({
  questionId,
  label,
  aggregate,
}: {
  questionId: string;
  label: string;
  aggregate: Aggregate;
}) {
  const headingId = `stat-${questionId}`;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-black/10 p-5 dark:border-white/15"
    >
      <h2 id={headingId} className="text-base font-semibold tracking-tight">
        {label}
      </h2>
      {renderBody(label, aggregate)}
    </section>
  );
}

function renderBody(label: string, aggregate: Aggregate) {
  switch (aggregate.type) {
    case "scale_1_10":
    case "number":
      return <NumericSection label={label} aggregate={aggregate} />;
    case "single_choice":
    case "multi_choice":
      return <ChoiceSection label={label} aggregate={aggregate} />;
  }
}

function NumericSection({
  label,
  aggregate,
}: {
  label: string;
  aggregate: Extract<Aggregate, { type: "scale_1_10" | "number" }>;
}) {
  const { bucket_min, histogram, mean, median, count } = aggregate;
  const ariaLabel =
    `Histogram of responses to ${label}. ` +
    `${count} responses, mean ${mean}, median ${median}.`;

  return (
    <>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        <span>
          Mean <strong className="text-zinc-900 dark:text-zinc-100">{mean}</strong>
        </span>
        <span className="mx-2 text-zinc-400">•</span>
        <span>
          Median <strong className="text-zinc-900 dark:text-zinc-100">{median}</strong>
        </span>
        <span className="mx-2 text-zinc-400">•</span>
        <span>
          {count} {count === 1 ? "response" : "responses"}
        </span>
      </p>
      <div className="mt-4">
        <HistogramChart
          bucketMin={bucket_min}
          histogram={histogram}
          ariaLabel={ariaLabel}
        />
      </div>
      <table className="sr-only">
        <caption>{label} — histogram of responses</caption>
        <thead>
          <tr>
            <th scope="col">Value</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          {histogram.map((value, idx) => (
            <tr key={idx}>
              <td>{bucket_min + idx}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Mean</th>
            <td>{mean}</td>
          </tr>
          <tr>
            <th scope="row">Median</th>
            <td>{median}</td>
          </tr>
          <tr>
            <th scope="row">Responses</th>
            <td>{count}</td>
          </tr>
        </tfoot>
      </table>
    </>
  );
}

function ChoiceSection({
  label,
  aggregate,
}: {
  label: string;
  aggregate: Extract<Aggregate, { type: "single_choice" | "multi_choice" }>;
}) {
  const { choices, order, type } = aggregate;
  const totalSelections = order.reduce((sum, choice) => sum + (choices[choice] ?? 0), 0);
  const ariaLabel =
    `Bar chart of responses to ${label}. ` +
    (type === "multi_choice"
      ? `Multi-select; ${totalSelections} total selections across ${order.length} options.`
      : `${totalSelections} responses across ${order.length} options.`);

  return (
    <>
      {type === "multi_choice" ? (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Multi-select — totals can exceed the number of respondents.
        </p>
      ) : null}
      <div className="mt-4">
        <ChoiceBarChart choices={choices} order={order} ariaLabel={ariaLabel} />
      </div>
      <table className="sr-only">
        <caption>{label} — count per choice</caption>
        <thead>
          <tr>
            <th scope="col">Choice</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          {order.map((choice) => (
            <tr key={choice}>
              <td>{choice}</td>
              <td>{choices[choice] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
