import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">Not authorized</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        You&rsquo;re signed in, but this page is for admins only.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center rounded-md border border-black/10 bg-white px-5 text-sm font-medium text-black hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
      >
        Back to home
      </Link>
    </div>
  );
}
