"use client";

import { useState, useTransition } from "react";
import { approveSurvey, deleteSurvey, unapproveSurvey } from "./actions";

export function RowActions({
  id,
  displayName,
  approved,
}: {
  id: string;
  displayName: string;
  approved: boolean;
}) {
  const [isApprovalPending, startApprovalTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onApprovalClick() {
    setError(null);
    if (
      approved &&
      !window.confirm(
        `Move "${displayName}" back to pending? This will hide their profile from the public directory and stats.`,
      )
    ) {
      return;
    }

    startApprovalTransition(async () => {
      const result = approved
        ? await unapproveSurvey(id)
        : await approveSurvey(id);
      if (!result.ok) setError(result.error);
    });
  }

  function onDeleteClick() {
    setError(null);
    if (
      !window.confirm(
        `Delete the submission for "${displayName}"? This removes the database row and the R2 photo. This cannot be undone.`,
      )
    ) {
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteSurvey(id);
      if (!result.ok) setError(result.error);
    });
  }

  const approvalLabel = approved ? "Unapprove" : "Approve";
  const approvalPendingLabel = approved ? "Unapproving..." : "Approving...";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onApprovalClick}
          disabled={isApprovalPending || isDeletePending}
          className={
            approved
              ? "inline-flex h-8 items-center rounded-md border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              : "inline-flex h-8 items-center rounded-md border border-emerald-300 bg-emerald-50 px-3 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-950/60"
          }
        >
          {isApprovalPending ? approvalPendingLabel : approvalLabel}
        </button>
        <button
          type="button"
          onClick={onDeleteClick}
          disabled={isApprovalPending || isDeletePending}
          className="inline-flex h-8 items-center rounded-md border border-red-300 bg-red-50 px-3 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/60"
        >
          {isDeletePending ? "Deleting..." : "Delete"}
        </button>
      </div>
      {error ? (
        <span className="max-w-56 text-right text-xs text-red-700 dark:text-red-300">
          {error}
        </span>
      ) : null}
    </div>
  );
}
