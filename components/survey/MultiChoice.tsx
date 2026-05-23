import type { Question } from "@/content/survey-questions";

type MultiChoiceQuestion = Extract<Question, { type: "multi_choice" }>;

export function MultiChoice({
  question,
  name,
  error,
}: {
  question: MultiChoiceQuestion;
  name: string;
  error?: string;
}) {
  const id = `answer-${question.id}`;

  return (
    <fieldset
      className="space-y-3"
      aria-describedby={error ? `${id}-error` : undefined}
    >
      <legend className="text-sm font-medium">{question.label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {question.choices.map((choice) => {
          const choiceId = `${id}-${choice.replace(/\W+/g, "-").toLowerCase()}`;
          return (
            <label
              key={choice}
              htmlFor={choiceId}
              className="flex items-center gap-2 rounded-md border border-black/10 px-3 py-2 text-sm transition hover:bg-black/[.02] dark:border-white/15 dark:hover:bg-white/[.04]"
            >
              <input
                id={choiceId}
                name={name}
                type="checkbox"
                value={choice}
                className="size-4 rounded accent-black dark:accent-white"
              />
              <span>{choice}</span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
