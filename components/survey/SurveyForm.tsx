"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { QUESTIONS, type Question } from "@/content/survey-questions";
import { submitSurvey, type SubmitSurveyState } from "@/app/survey/actions";
import { LongText } from "@/components/survey/LongText";
import { MultiChoice } from "@/components/survey/MultiChoice";
import { NumberInput } from "@/components/survey/NumberInput";
import { PhotoUpload } from "@/components/survey/PhotoUpload";
import { ScaleSlider } from "@/components/survey/ScaleSlider";
import { ShortText } from "@/components/survey/ShortText";
import { SingleChoice } from "@/components/survey/SingleChoice";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
    >
      {pending ? "Submitting..." : "Submit survey"}
    </button>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="text-sm text-red-600">
      {error}
    </p>
  );
}

function firstError(state: SubmitSurveyState, field: string) {
  return state?.fieldErrors?.[field]?.[0];
}

function QuestionInput({
  question,
  error,
}: {
  question: Question;
  error?: string;
}) {
  const name = `answers.${question.id}`;

  switch (question.type) {
    case "short_text":
      return <ShortText question={question} name={name} error={error} />;
    case "long_text":
      return <LongText question={question} name={name} error={error} />;
    case "number":
      return <NumberInput question={question} name={name} error={error} />;
    case "scale_1_10":
      return <ScaleSlider question={question} name={name} error={error} />;
    case "single_choice":
      return <SingleChoice question={question} name={name} error={error} />;
    case "multi_choice":
      return <MultiChoice question={question} name={name} error={error} />;
  }
}

export function SurveyForm({
  defaultDisplayName,
  publicHost,
}: {
  defaultDisplayName: string;
  publicHost: string;
}) {
  const [state, formAction] = useActionState(submitSurvey, null);
  const [photoKey, setPhotoKey] = useState("");

  return (
    <form action={formAction} className="space-y-8">
      {state?.error ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
        >
          {state.error}
        </div>
      ) : null}

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Your profile</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            This is what classmates will see in the directory unless you hide
            your socials.
          </p>
        </div>

        <PhotoUpload
          value={photoKey}
          onUploadedKey={setPhotoKey}
          publicHost={publicHost}
          error={firstError(state, "photo_key")}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="display_name" className="block text-sm font-medium">
              Display name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              maxLength={80}
              defaultValue={defaultDisplayName}
              aria-invalid={firstError(state, "display_name") ? "true" : undefined}
              aria-describedby={
                firstError(state, "display_name") ? "display-name-error" : undefined
              }
              className="w-full rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-black/40 dark:border-white/15 dark:focus:border-white/50"
            />
            <FieldError
              id="display-name-error"
              error={firstError(state, "display_name")}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="instagram_handle"
              className="block text-sm font-medium"
            >
              Instagram handle
            </label>
            <input
              id="instagram_handle"
              name="instagram_handle"
              type="text"
              maxLength={60}
              placeholder="without @"
              aria-invalid={
                firstError(state, "instagram_handle") ? "true" : undefined
              }
              aria-describedby={
                firstError(state, "instagram_handle")
                  ? "instagram-handle-error"
                  : undefined
              }
              className="w-full rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-black/40 dark:border-white/15 dark:focus:border-white/50"
            />
            <FieldError
              id="instagram-handle-error"
              error={firstError(state, "instagram_handle")}
            />
          </div>
        </div>

        <div className="text-sm">
          <label className="flex items-start gap-3 rounded-md border border-black/10 p-3 dark:border-white/15">
            <input
              name="hide_socials"
              type="checkbox"
              className="mt-0.5 size-4 rounded accent-black dark:accent-white"
            />
            <span>Hide my social links from the public directory</span>
          </label>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Senior survey</h2>
        </div>
        <div className="space-y-6">
          {QUESTIONS.map((question) => (
            <div
              key={question.id}
              className="rounded-md border border-black/10 p-4 dark:border-white/15"
            >
              <QuestionInput
                question={question}
                error={firstError(state, `answers.${question.id}`)}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-black/10 pt-6 dark:border-white/15">
        <SubmitButton disabled={!photoKey} />
      </div>
    </form>
  );
}
