import { Suspense } from "react";
import { redirect } from "next/navigation";
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
  approved_at: string | null;
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
  if (existing.submitted) {
    redirect("/survey/thanks");
  }

  return <SurveyForm defaultDisplayName={user.name ?? ""} />;
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
