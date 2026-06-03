import type { Question } from "@/content/survey-questions";
import { ScaleSlider } from "@/components/survey/ScaleSlider";

type NumberQuestion = Extract<Question, { type: "number" }>;

const SLIDERIZED_NUMBERS: Record<
  string,
  {
    step: number;
    defaultValue: number;
    minLabel: string;
    maxLabel: string;
    formatValue: (value: number) => string;
  }
> = {
  avg_sleep: {
    step: 0.5,
    defaultValue: 7.5,
    minLabel: "3h",
    maxLabel: "12h",
    formatValue: (value) => `${value.toFixed(1)}h`,
  },
  study_hours: {
    step: 1,
    defaultValue: 20,
    minLabel: "0h",
    maxLabel: "40h",
    formatValue: (value) => `${value.toFixed(0)}h`,
  },
  screen_time: {
    step: 0.5,
    defaultValue: 7.5,
    minLabel: "1h",
    maxLabel: "14h",
    formatValue: (value) => `${value.toFixed(1)}h`,
  },
};

export function NumberInput({
  question,
  name,
  error,
  defaultValue,
}: {
  question: NumberQuestion;
  name: string;
  error?: string;
  defaultValue?: string;
}) {
  const id = `answer-${question.id}`;
  const sliderConfig = SLIDERIZED_NUMBERS[question.id];
  const parsedDefaultValue = numberDefault(defaultValue);

  if (sliderConfig) {
    return (
      <ScaleSlider
        question={question}
        name={name}
        error={error}
        min={question.min}
        max={question.max}
        step={sliderConfig.step}
        defaultValue={parsedDefaultValue ?? sliderConfig.defaultValue}
        minLabel={sliderConfig.minLabel}
        maxLabel={sliderConfig.maxLabel}
        formatValue={sliderConfig.formatValue}
      />
    );
  }

  return (
    <div className="jf-survey-field">
      <label htmlFor={id}>{question.label}</label>
      <input
        id={id}
        name={name}
        type="number"
        min={question.min}
        max={question.max}
        step="any"
        defaultValue={defaultValue}
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

function numberDefault(value?: string) {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
