"use server";

import { redirect } from "next/navigation";
import { QUESTIONS } from "@/content/survey-questions";
import { requireUser } from "@/lib/auth";
import { goClient, GoApiConnectionError, GoApiError } from "@/lib/go-client";
import { SurveyFormSchema } from "@/lib/schemas";
import type { z } from "zod";

export type SubmitSurveyState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

const SurveyPreflightSchema = SurveyFormSchema.omit({ photo_key: true });

function formDataToSurveyInput(formData: FormData) {
  const answers: Record<string, FormDataEntryValue | string[]> = {};

  for (const question of QUESTIONS) {
    const name = `answers.${question.id}`;
    if (question.type === "multi_choice") {
      answers[question.id] = formData
        .getAll(name)
        .filter((value): value is string => typeof value === "string");
    } else {
      const value = formData.get(name);
      if (typeof value === "string" && value.trim() === "") continue;
      if (value !== null) answers[question.id] = value;
    }
  }

  return {
    display_name: formData.get("display_name"),
    photo_key: formData.get("photo_key"),
    instagram_handle: formData.get("instagram_handle"),
    linkedin: formData.get("linkedin") ?? undefined,
    answers,
  };
}

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!key) continue;
    errors[key] ??= [];
    errors[key].push(issue.message);
  }
  return errors;
}

function validationErrorState(error: z.ZodError): SubmitSurveyState {
  return {
    error: "Please fix the highlighted fields.",
    fieldErrors: fieldErrors(error),
  };
}

export async function validateSurveyFields(
  _prev: SubmitSurveyState,
  formData: FormData,
): Promise<SubmitSurveyState> {
  await requireUser();
  const parsed = SurveyPreflightSchema.safeParse(formDataToSurveyInput(formData));

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  return null;
}

export async function submitSurvey(
  _prev: SubmitSurveyState,
  formData: FormData,
): Promise<SubmitSurveyState> {
  const user = await requireUser();
  const parsed = SurveyFormSchema.safeParse(formDataToSurveyInput(formData));

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  try {
    await goClient.post(
      "/survey",
      {
        user_id: user.id,
        display_name: parsed.data.display_name,
        photo_key: parsed.data.photo_key,
        instagram_handle: parsed.data.instagram_handle,
        linkedin: parsed.data.linkedin ?? "",
        answers: parsed.data.answers,
      },
      { callerEmail: user.email },
    );
  } catch (e) {
    if (e instanceof GoApiError && e.code === "conflict") {
      redirect("/survey/thanks");
    }
    if (e instanceof GoApiError) {
      return { error: e.message };
    }
    if (e instanceof GoApiConnectionError) {
      return {
        error:
          "The survey API is unavailable right now. Try again after the API is running.",
      };
    }
    throw e;
  }

  redirect("/survey/thanks");
}
