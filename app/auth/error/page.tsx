import Link from "next/link";
import { Suspense } from "react";

type SearchParams = Promise<{ error?: string }>;

async function ErrorDetails({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;
  const message =
    error === "AccessDenied"
      ? "This site is only open to PDSB students. Please sign in with your @pdsb.net Google account."
      : "Something went wrong while signing you in. Please try again.";

  return (
    <>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
      {error ? (
        <p className="mt-1 font-mono text-xs text-zinc-500">code: {error}</p>
      ) : null}
    </>
  );
}

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">Sign-in error</h1>
      <Suspense
        fallback={
          <p className="mt-2 text-sm text-zinc-500">Loading details…</p>
        }
      >
        <ErrorDetails searchParams={searchParams} />
      </Suspense>
      <Link
        href="/auth/sign-in"
        className="mt-8 inline-flex h-11 items-center rounded-md border border-black/10 bg-white px-5 text-sm font-medium text-black hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
      >
        Try again
      </Link>
    </div>
  );
}
