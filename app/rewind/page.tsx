import { TimelineEntry } from "@/components/TimelineEntry";
import { getRewindEntries } from "@/lib/rewind";

export const metadata = {
  title: "Rewind — Class of 2026",
};

export default function RewindPage() {
  const entries = getRewindEntries();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8">
        <p className="text-sm font-medium text-zinc-500">Class of 2026</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Rewind</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          A chronological scroll through our years together.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          The timeline is empty for now — check back soon.
        </p>
      ) : (
        <div className="flex flex-col gap-12">
          {entries.map((entry, i) => (
            <TimelineEntry
              key={`${entry.date}-${entry.image}`}
              entry={entry}
              priority={i === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
