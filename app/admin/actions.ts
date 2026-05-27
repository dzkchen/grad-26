"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { goClient, GoApiConnectionError, GoApiError } from "@/lib/go-client";

export type DeleteSurveyResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteSurvey(id: string): Promise<DeleteSurveyResult> {
  const admin = await requireAdmin();

  try {
    await goClient.delete(`/admin/surveys/${encodeURIComponent(id)}`, {
      callerEmail: admin.email,
    });
  } catch (e) {
    if (e instanceof GoApiError) {
      return { ok: false, error: e.message };
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
