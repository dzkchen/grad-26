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
  answers: Record<string, unknown>;
  submitted_at: string;
  approved_at: string | null;
};

export type AdminSurveyPage = {
  surveys: AdminSurvey[];
  total: number;
};

type GoAdminListResponse = {
  surveys: AdminSurvey[];
  total: number;
};

export const ADMIN_PAGE_SIZE = 25;

// No `'use cache'` here: admin always wants live data so a freshly-deleted row
// disappears on the next render without waiting on tag invalidation.
export async function getSurveys(
  admin: AuthUser,
  page: number,
  pageSize: number = ADMIN_PAGE_SIZE,
): Promise<AdminSurveyPage> {
  const offset = (page - 1) * pageSize;
  const data = await goClient.get<GoAdminListResponse>(
    "/admin/surveys",
    { limit: pageSize, offset },
    { callerEmail: admin.email },
  );
  return { surveys: data.surveys, total: data.total };
}
