"use client";

import { useState } from "react";
import type { Question } from "@/content/survey-questions";

type SliderQuestion = Extract<Question, { type: "scale_1_10" | "number" }>;

export function ScaleSlider({
  question,
  name,
  error,
  min = question.type === "number" ? (question.min ?? 0) : 1,
  max = question.type === "number" ? (question.max ?? 100) : 10,
  step = 1,
  defaultValue = question.type === "scale_1_10" ? 5 : min,
  minLabel = String(min),
  maxLabel = String(max),
  formatValue = (value: number) => String(value),
}: {
  question: SliderQuestion;
  name: string;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  minLabel?: string;
  maxLabel?: string;
  formatValue?: (value: number) => string;
}) {
  const id = `answer-${question.id}`;
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="jf-survey-field">
      <label htmlFor={id}>{question.label}</label>
      <div className="jf-survey-slider-wrap">
        <div className="jf-survey-slider-row">
          <input
            id={id}
            name={name}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="jf-survey-slider-input"
          />
          <output htmlFor={id} className="jf-survey-slider-value">
            {formatValue(value)}
          </output>
        </div>
        <div className="jf-survey-slider-labels">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      </div>
      {error ? (
        <p id={`${id}-error`} className="jf-survey-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
