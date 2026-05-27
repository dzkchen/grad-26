"use client";

import { useState, useTransition } from "react";
import { deleteSurvey } from "./actions";

export function DeleteRow({
  id,
  displayName,
}: {
  id: string;
  displayName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    if (
      !window.confirm(
        `Delete the submission for "${displayName}"? This removes the database row and the R2 photo. This cannot be undone.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteSurvey(id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="inline-flex h-8 items-center rounded-md border border-red-300 bg-red-50 px-3 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/60"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error ? (
        <span className="text-xs text-red-700 dark:text-red-300">{error}</span>
      ) : null}
    </div>
  );
}
