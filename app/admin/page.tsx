import Image from "next/image";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getAllSurveys, type AdminSurvey } from "@/lib/data/admin";
import { GoApiConnectionError, GoApiError } from "@/lib/go-client";
import { RowActions } from "./RowActions";

export const metadata = {
  title: "Admin — Class of 2026",
};

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short",
});

function AdminConnectionError({ error }: { error: GoApiConnectionError }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
      <h2 className="text-lg font-semibold tracking-tight">
        Admin API unavailable
      </h2>
      <p className="mt-2">Could not reach the Go API at {error.url}.</p>
    </div>
  );
}

function AdminApiError({ error }: { error: GoApiError }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
      <h2 className="text-lg font-semibold tracking-tight">Admin API error</h2>
      <p className="mt-2">
        The Go API responded with {error.status} ({error.code}).
      </p>
      <p className="mt-2">{error.message}</p>
    </div>
  );
}

function AdminTable({ surveys }: { surveys: AdminSurvey[] }) {
  if (surveys.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No submissions yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-black/10 dark:border-white/15">
      <table className="min-w-full divide-y divide-black/10 text-sm dark:divide-white/15">
        <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/60">
          <tr>
            <th className="px-4 py-3">Photo</th>
            <th className="px-4 py-3">Display name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Flags</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 dark:divide-white/10">
          {surveys.map((survey) => (
            <tr key={survey.id}>
              <td className="px-4 py-3">
                {survey.photo_url ? (
                  <Image
                    src={survey.photo_url}
                    alt={`${survey.display_name} photo`}
                    width={56}
                    height={56}
                    className="aspect-square w-14 rounded-md object-cover"
                  />
                ) : (
                  <span className="text-xs text-zinc-400">no photo</span>
                )}
              </td>
              <td className="px-4 py-3 font-medium">{survey.display_name}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {survey.user_email}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                {dateFormatter.format(new Date(survey.submitted_at))}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-xs">
                {survey.approved_at ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                    Approved on{" "}
                    {dateFormatter.format(new Date(survey.approved_at))}
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    Pending
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-xs">
                {survey.hide_socials ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    socials hidden
                  </span>
                ) : (
                  <span className="text-zinc-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <RowActions survey={survey} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function AdminContent() {
  const admin = await requireAdmin();

  let surveys: AdminSurvey[];
  try {
    surveys = await getAllSurveys(admin);
  } catch (e) {
    if (e instanceof GoApiConnectionError) return <AdminConnectionError error={e} />;
    if (e instanceof GoApiError) return <AdminApiError error={e} />;
    throw e;
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-zinc-500">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Submissions
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {surveys.length} {surveys.length === 1 ? "submission" : "submissions"}.
          Deleting a row removes the DB record and the R2 photo and cannot be
          undone.
        </p>
      </header>
      <AdminTable surveys={surveys} />
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Suspense
        fallback={
          <div className="text-sm text-zinc-500">Loading submissions…</div>
        }
      >
        <AdminContent />
      </Suspense>
    </div>
  );
}
