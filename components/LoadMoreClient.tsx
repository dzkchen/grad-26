"use client";

import { useState, useTransition } from "react";
import { DirectoryCard } from "@/components/DirectoryCard";
import type { DirectoryEntry, DirectoryPage } from "@/lib/data/directory";

export function LoadMoreClient({ initialCursor }: { initialCursor: string | null }) {
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!cursor && entries.length === 0) return null;

  function loadMore() {
    if (!cursor) return;
    setError(null);
    const next = cursor;
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/directory?cursor=${encodeURIComponent(next)}`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          setError(`Failed to load more (${res.status}).`);
          return;
        }
        const page = (await res.json()) as DirectoryPage;
        setEntries((prev) => [...prev, ...page.entries]);
        setCursor(page.nextCursor);
      } catch {
        setError("Failed to load more.");
      }
    });
  }

  return (
    <>
      {entries.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {entries.map((entry) => (
            <DirectoryCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : null}

      {cursor ? (
        <div className="mt-8 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={loadMore}
            disabled={isPending}
            className="rounded-md border border-black/10 px-4 py-2 text-sm font-medium transition hover:bg-black/[.04] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/[.06]"
          >
            {isPending ? "Loading..." : "Load more"}
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      ) : null}
    </>
  );
}
