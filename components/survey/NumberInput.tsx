import type { Question } from "@/content/survey-questions";

type NumberQuestion = Extract<Question, { type: "number" }>;

export function NumberInput({
  question,
  name,
  error,
}: {
  question: NumberQuestion;
  name: string;
  error?: string;
}) {
  const id = `answer-${question.id}`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {question.label}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        min={question.min}
        max={question.max}
        step="any"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-black/40 dark:border-white/15 dark:focus:border-white/50"
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
