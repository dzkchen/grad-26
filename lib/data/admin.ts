import "server-only";

import { goClient } from "@/lib/go-client";
import type { AuthUser } from "@/lib/auth";

export type AdminSurvey = {
  id: string;
  user_email: string;
  display_name: string;
  photo_url: string;
  instagram_handle?: string;
  linkedin?: string;
  hide_socials: boolean;
  submitted_at: string;
  approved_at: string | null;
};

type GoAdminListResponse = {
  surveys: AdminSurvey[];
};

// No `'use cache'` here: admin always wants live data so a freshly-deleted row
// disappears on the next render without waiting on tag invalidation.
export async function getAllSurveys(admin: AuthUser): Promise<AdminSurvey[]> {
  const data = await goClient.get<GoAdminListResponse>(
    "/admin/surveys",
    undefined,
    { callerEmail: admin.email },
  );
  return data.surveys;
}
