import type { Question } from "@/content/survey-questions";

type ShortTextQuestion = Extract<Question, { type: "short_text" }>;

export function ShortText({
  question,
  name,
  error,
}: {
  question: ShortTextQuestion;
  name: string;
  error?: string;
}) {
  const id = `answer-${question.id}`;

  return (
    <div className="jf-survey-field">
      <label htmlFor={id}>{question.label}</label>
      <input
        id={id}
        name={name}
        type="text"
        maxLength={question.maxLength}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="jf-survey-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
