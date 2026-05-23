"use client";

import { useState } from "react";
import type { Question } from "@/content/survey-questions";

type ScaleQuestion = Extract<Question, { type: "scale_1_10" }>;

export function ScaleSlider({
  question,
  name,
  error,
}: {
  question: ScaleQuestion;
  name: string;
  error?: string;
}) {
  const id = `answer-${question.id}`;
  const [value, setValue] = useState(5);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="block text-sm font-medium">
          {question.label}
        </label>
        <output
          htmlFor={id}
          className="min-w-8 rounded-md border border-black/10 px-2 py-1 text-center text-sm font-medium dark:border-white/15"
        >
          {value}
        </output>
      </div>
      <input
        id={id}
        name={name}
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full accent-black dark:accent-white"
      />
      <div className="flex justify-between text-xs text-zinc-500">
        <span>1</span>
        <span>10</span>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
