import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";

async function ThanksContent() {
  await requireUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-sm font-medium text-green-700 dark:text-green-400">
        Survey submitted
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        You&apos;re in.
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Your Class of 2026 profile has been saved. Directory and stats pages are
        coming next.
      </p>
      <Link
        href="/directory"
        className="mt-8 inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Go to directory
      </Link>
    </div>
  );
}

export default function SurveyThanksPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-zinc-500">
          Loading...
        </div>
      }
    >
      <ThanksContent />
    </Suspense>
  );
}
