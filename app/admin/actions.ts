"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  goClient,
  GoApiConnectionError,
  GoApiError,
  toPublicMessage,
} from "@/lib/go-client";

export type AdminSurveyActionResult =
  | { ok: true }
  | { ok: false; error: string };

async function runAdminSurveyMutation(
  mutate: (adminEmail: string) => Promise<void>,
): Promise<AdminSurveyActionResult> {
  const admin = await requireAdmin();

  try {
    await mutate(admin.email);
  } catch (e) {
    if (e instanceof GoApiError) {
      return { ok: false, error: toPublicMessage(e) };
    }
    if (e instanceof GoApiConnectionError) {
      return {
        ok: false,
        error: "The survey API is unavailable right now. Try again shortly.",
      };
    }
    throw e;
  }

  updateTag("directory");
  updateTag("stats");
  revalidatePath("/admin");
  return { ok: true };
}

export async function approveSurvey(
  id: string,
): Promise<AdminSurveyActionResult> {
  return runAdminSurveyMutation((adminEmail) =>
    goClient.post<void>(
      `/admin/surveys/${encodeURIComponent(id)}/approve`,
      undefined,
      { callerEmail: adminEmail },
    ),
  );
}

export async function unapproveSurvey(
  id: string,
): Promise<AdminSurveyActionResult> {
  return runAdminSurveyMutation((adminEmail) =>
    goClient.post<void>(
      `/admin/surveys/${encodeURIComponent(id)}/unapprove`,
      undefined,
      { callerEmail: adminEmail },
    ),
  );
}

export async function deleteSurvey(
  id: string,
): Promise<AdminSurveyActionResult> {
  return runAdminSurveyMutation((adminEmail) =>
    goClient.delete(`/admin/surveys/${encodeURIComponent(id)}`, {
      callerEmail: adminEmail,
    }),
  );
}
