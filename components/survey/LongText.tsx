import type { Question } from "@/content/survey-questions";

type LongTextQuestion = Extract<Question, { type: "long_text" }>;

export function LongText({
  question,
  name,
  error,
}: {
  question: LongTextQuestion;
  name: string;
  error?: string;
}) {
  const id = `answer-${question.id}`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {question.label}
      </label>
      <textarea
        id={id}
        name={name}
        maxLength={question.maxLength}
        rows={4}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full resize-y rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-black/40 dark:border-white/15 dark:focus:border-white/50"
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
