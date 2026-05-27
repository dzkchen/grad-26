import type { Question } from "@/content/survey-questions";

type SingleChoiceQuestion = Extract<Question, { type: "single_choice" }>;

export function SingleChoice({
  question,
  name,
  error,
}: {
  question: SingleChoiceQuestion;
  name: string;
  error?: string;
}) {
  const id = `answer-${question.id}`;

  return (
    <fieldset
      className="jf-survey-field"
      aria-describedby={error ? `${id}-error` : undefined}
    >
      <legend className="jf-survey-label">{question.label}</legend>
      <div className="jf-survey-option-chips">
        {question.choices.map((choice) => {
          const choiceId = `${id}-${choice.replace(/\W+/g, "-").toLowerCase()}`;
          return (
            <label
              key={choice}
              htmlFor={choiceId}
            >
              <input
                id={choiceId}
                name={name}
                type="radio"
                value={choice}
                className="jf-survey-chip-input"
              />
              <span className="jf-survey-option-chip">{choice}</span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={`${id}-error`} className="jf-survey-error">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
