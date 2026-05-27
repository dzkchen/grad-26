"use client";

import { useState } from "react";
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
  const [count, setCount] = useState(0);

  return (
    <div className="jf-survey-field">
      <label htmlFor={id}>{question.label}</label>
      <textarea
        id={id}
        name={name}
        maxLength={question.maxLength}
        rows={4}
        onChange={(event) => setCount(event.target.value.length)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {question.maxLength ? (
        <div className="jf-survey-char-counter">
          {count}/{question.maxLength}
        </div>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="jf-survey-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
