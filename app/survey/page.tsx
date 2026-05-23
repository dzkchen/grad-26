import Image from "next/image";
import { Suspense } from "react";
import { requireUser, type AuthUser } from "@/lib/auth";
import { goClient } from "@/lib/go-client";
import { SurveyForm } from "@/components/survey/SurveyForm";

type SurveyEntry = {
  display_name: string;
  photo_key: string;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  other_social_url: string | null;
  post_secondary: string;
  hide_socials: boolean;
  hide_post_secondary: boolean;
  answers: Record<string, unknown>;
  submitted_at: string;
};

type MeSurveyResponse =
  | { submitted: false }
  | { submitted: true; id: string; entry: SurveyEntry };

async function getMySurvey(user: AuthUser) {
  return goClient.get<MeSurveyResponse>(
    "/me/survey",
    { user_id: user.id },
    { callerEmail: user.email },
  );
}

function firstAdminEmail() {
  return (
    process.env.ADMIN_EMAILS?.split(",").map((email) => email.trim()).find(Boolean) ??
    "the site admin"
  );
}

function AlreadySubmitted({
  id,
  entry,
  publicHost,
}: {
  id: string;
  entry: SurveyEntry;
  publicHost: string;
}) {
  const photoUrl = publicHost ? `https://${publicHost}/${entry.photo_key}` : null;
  const submittedAt = new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(entry.submitted_at));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-md border border-black/10 p-6 dark:border-white/15">
        <div className="flex flex-col gap-5 sm:flex-row">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={`${entry.display_name} survey photo`}
              width={160}
              height={160}
              className="aspect-square w-32 rounded-md object-cover"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Already submitted
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {entry.display_name}
            </h1>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Submission ID</dt>
                <dd className="font-mono text-xs">{id}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Submitted</dt>
                <dd>{submittedAt}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Post-secondary</dt>
                <dd>
                  {entry.hide_post_secondary
                    ? "Hidden from directory"
                    : entry.post_secondary}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Socials</dt>
                <dd>
                  {entry.hide_socials
                    ? "Hidden from directory"
                    : [
                        entry.instagram_handle
                          ? `Instagram: ${entry.instagram_handle}`
                          : null,
                        entry.tiktok_handle ? `TikTok: ${entry.tiktok_handle}` : null,
                        entry.other_social_url,
                      ]
                        .filter(Boolean)
                        .join(", ") || "None added"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Survey answers</dt>
                <dd>{Object.keys(entry.answers ?? {}).length} saved</dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
              Want to change something? Email {firstAdminEmail()}. There is no
              self-serve edit flow in v1.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

async function SurveyContent() {
  const user = await requireUser();
  const existing = await getMySurvey(user);
  const publicHost = process.env.R2_PUBLIC_HOSTNAME ?? "";

  if (existing.submitted) {
    return (
      <AlreadySubmitted
        id={existing.id}
        entry={existing.entry}
        publicHost={publicHost}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm font-medium text-zinc-500">Senior survey</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Submit your Class of 2026 profile
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Upload your photo, choose what stays private, and answer as many
          survey questions as you want.
        </p>
      </div>
      <SurveyForm
        defaultDisplayName={user.name ?? ""}
        publicHost={publicHost}
      />
    </div>
  );
}

export default function SurveyPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-zinc-500">
          Loading survey...
        </div>
      }
    >
      <SurveyContent />
    </Suspense>
  );
}
