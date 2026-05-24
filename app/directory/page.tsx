import { DirectoryCard } from "@/components/DirectoryCard";
import { LoadMoreClient } from "@/components/LoadMoreClient";
import { getDirectoryPage } from "@/lib/data/directory";

export const metadata = {
  title: "Directory — Class of 2026",
};

export default async function DirectoryPage() {
  const { entries, nextCursor } = await getDirectoryPage();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <p className="text-sm font-medium text-zinc-500">Class of 2026</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Directory
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Everyone who has submitted the senior survey, newest first.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No submissions yet. Be the first to{" "}
          <a href="/survey" className="underline hover:no-underline">
            fill out the survey
          </a>
          .
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {entries.map((entry) => (
            <DirectoryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      <LoadMoreClient initialCursor={nextCursor} />
    </div>
  );
}
