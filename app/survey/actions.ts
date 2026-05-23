"use server";

import { updateTag } from "next/cache";
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
    tiktok_handle: formData.get("tiktok_handle"),
    other_social_url: formData.get("other_social_url"),
    post_secondary: formData.get("post_secondary"),
    hide_socials: formData.get("hide_socials"),
    hide_post_secondary: formData.get("hide_post_secondary"),
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

export async function submitSurvey(
  _prev: SubmitSurveyState,
  formData: FormData,
): Promise<SubmitSurveyState> {
  const user = await requireUser();
  const parsed = SurveyFormSchema.safeParse(formDataToSurveyInput(formData));

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  try {
    await goClient.post(
      "/survey",
      {
        user_id: user.id,
        ...parsed.data,
      },
      { callerEmail: user.email },
    );
  } catch (e) {
    if (e instanceof GoApiError && e.code === "conflict") {
      return { error: "You have already submitted." };
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

  updateTag("directory");
  updateTag("stats");
  redirect("/survey/thanks");
}
