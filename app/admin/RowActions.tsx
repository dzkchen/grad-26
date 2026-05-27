"use client";

import { useState, useTransition } from "react";
import { QUESTIONS } from "@/content/survey-questions";
import type { AdminSurvey } from "@/lib/data/admin";
import { approveSurvey, deleteSurvey, unapproveSurvey } from "./actions";

export function RowActions({
  survey,
}: {
  survey: AdminSurvey;
}) {
  const [isApprovalPending, startApprovalTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const approved = survey.approved_at !== null;

  function onApprovalClick() {
    setError(null);
    if (
      approved &&
      !window.confirm(
        `Move "${survey.display_name}" back to pending? This will hide their profile from the public directory and stats.`,
      )
    ) {
      return;
    }

    startApprovalTransition(async () => {
      const result = approved
        ? await unapproveSurvey(survey.id)
        : await approveSurvey(survey.id);
      if (!result.ok) setError(result.error);
    });
  }

  function onDeleteClick() {
    setError(null);
    if (
      !window.confirm(
        `Delete the submission for "${survey.display_name}"? This removes the database row and the R2 photo. This cannot be undone.`,
      )
    ) {
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteSurvey(survey.id);
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
          onClick={() => setIsOpen(true)}
          disabled={isApprovalPending || isDeletePending}
          className="inline-flex h-8 items-center rounded-md border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Open
        </button>
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
      {isOpen ? (
        <SubmissionDialog survey={survey} onClose={() => setIsOpen(false)} />
      ) : null}
    </div>
  );
}

function SubmissionDialog({
  survey,
  onClose,
}: {
  survey: AdminSurvey;
  onClose: () => void;
}) {
  const submittedAt = formatDate(survey.submitted_at);
  const approvedAt = survey.approved_at ? formatDate(survey.approved_at) : null;
  const answerRows = buildAnswerRows(survey.answers ?? {});

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`submission-${survey.id}-title`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl rounded-md border border-black/10 bg-white p-5 shadow-xl dark:border-white/15 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">Submission</p>
            <h2
              id={`submission-${survey.id}-title`}
              className="mt-1 text-2xl font-semibold tracking-tight"
            >
              {survey.display_name}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {survey.user_email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 items-center rounded-md border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Close
          </button>
        </div>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <MetaItem label="Submission ID" value={survey.id} mono />
          <MetaItem label="Submitted" value={submittedAt} />
          <MetaItem label="Status" value={approvedAt ? `Approved on ${approvedAt}` : "Pending"} />
          <MetaItem
            label="Instagram"
            value={survey.instagram_handle ? `@${survey.instagram_handle}` : "Not added"}
          />
          <MetaItem label="LinkedIn" value={survey.linkedin ?? "Not added"} />
          <MetaItem label="Socials hidden" value={survey.hide_socials ? "Yes" : "No"} />
        </dl>

        <div className="mt-6 border-t border-black/10 pt-5 dark:border-white/15">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Survey answers
          </h3>
          <dl className="mt-3 divide-y divide-black/5 dark:divide-white/10">
            {answerRows.map((row) => (
              <div key={row.id} className="grid gap-1 py-3 sm:grid-cols-[14rem_1fr]">
                <dt className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {row.label}
                </dt>
                <dd className="whitespace-pre-wrap break-words text-sm text-zinc-600 dark:text-zinc-400">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

function MetaItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className={mono ? "break-all font-mono text-xs" : "break-words"}>
        {value}
      </dd>
    </div>
  );
}

function buildAnswerRows(answers: Record<string, unknown>) {
  const seen = new Set<string>();
  const rows = QUESTIONS.map((question) => {
    seen.add(question.id);
    return {
      id: question.id,
      label: question.label,
      value: formatAnswer(answers[question.id]),
    };
  });

  for (const [id, value] of Object.entries(answers)) {
    if (!seen.has(id)) {
      rows.push({ id, label: id, value: formatAnswer(value) });
    }
  }

  return rows;
}

function formatAnswer(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not answered";
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(formatAnswer).join(", ") : "Not answered";
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
