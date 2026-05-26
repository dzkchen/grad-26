import Image from "next/image";
import { Suspense } from "react";
import { requireUser, type AuthUser } from "@/lib/auth";
import { GoApiConnectionError, GoApiError, goClient } from "@/lib/go-client";
import { SurveyForm } from "@/components/survey/SurveyForm";

type SurveyEntry = {
  display_name: string;
  photo_key: string;
  instagram_handle: string | null;
  linkedin: string | null;
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
                <dt className="text-zinc-500">Socials</dt>
                <dd>
                  {[
                    entry.instagram_handle &&
                      `Instagram: ${entry.instagram_handle}`,
                    entry.linkedin && `LinkedIn: ${entry.linkedin}`,
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

function SurveyUnavailable({ error }: { error: GoApiConnectionError }) {
  const isLocalTarget =
    error.url.includes("localhost") || error.url.includes("127.0.0.1");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
        <h1 className="text-lg font-semibold tracking-tight">
          Survey API unavailable
        </h1>
        <p className="mt-2">
          The survey page could not reach the Go API, so it cannot check whether
          you have already submitted.
        </p>
        <p className="mt-3">
          {isLocalTarget
            ? "For local dev, start the API in a second terminal with `go run ./cmd/server` from the `api/` directory. On Vercel, set `GO_API_URL` to the deployed Cloud Run HTTPS URL, not localhost."
            : "Check that `GO_API_URL` points to the deployed Cloud Run HTTPS URL and that the service is reachable."}
        </p>
      </div>
    </div>
  );
}

function SurveyApiError({ error }: { error: GoApiError }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
        <h1 className="text-lg font-semibold tracking-tight">
          Survey API error
        </h1>
        <p className="mt-2">
          The Go API responded with {error.status} ({error.code}).
        </p>
        <p className="mt-3">
          {error.status === 404
            ? "Deploy the latest Go API so `/me/survey` exists, then redeploy or refresh the Vercel preview."
            : error.message}
        </p>
      </div>
    </div>
  );
}

async function SurveyContent() {
  const user = await requireUser();
  let existing: MeSurveyResponse;
  try {
    existing = await getMySurvey(user);
  } catch (e) {
    if (e instanceof GoApiConnectionError) {
      return <SurveyUnavailable error={e} />;
    }
    if (e instanceof GoApiError) {
      return <SurveyApiError error={e} />;
    }
    throw e;
  }
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
          Upload your photo and answer as many survey questions as you want.
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
