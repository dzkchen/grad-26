"use client";

import { useEffect, useState } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 5 * 1024 * 1024;

type PhotoStatus =
  | { kind: "idle" }
  | { kind: "selected"; name: string }
  | { kind: "error"; message: string };

export function PhotoUpload({
  value,
  onFileSelected,
  isUploading,
  disabled,
  error,
}: {
  value: string;
  onFileSelected: (file: File | null) => void;
  isUploading: boolean;
  disabled: boolean;
  error?: string;
}) {
  const [status, setStatus] = useState<PhotoStatus>({ kind: "idle" });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFile(file: File) {
    onFileSelected(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      setStatus({
        kind: "error",
        message: `Unsupported type: ${file.type || "unknown"}. Use JPEG, PNG, or WebP.`,
      });
      return;
    }

    if (file.size < 1 || file.size > MAX_BYTES) {
      setStatus({
        kind: "error",
        message: `Photo must be between 1 byte and 5 MB. This file is ${file.size} bytes.`,
      });
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    onFileSelected(file);
    setStatus({ kind: "selected", name: file.name });
  }

  const visibleError = status.kind === "error" ? status.message : error;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="survey-photo" className="block text-sm font-medium">
          Photo
        </label>
        <input
          id="survey-photo"
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          disabled={isUploading || disabled}
          aria-invalid={visibleError ? "true" : undefined}
          aria-describedby={visibleError ? "survey-photo-error" : undefined}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-black file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 disabled:opacity-60 dark:file:bg-white dark:file:text-black dark:hover:file:bg-zinc-200"
        />
        <input type="hidden" name="photo_key" value={value} />
      </div>

      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Selected survey photo preview"
          className="aspect-square w-32 rounded-md border border-black/10 object-cover dark:border-white/15"
        />
      ) : null}

      <div aria-live="polite" className="text-sm">
        {isUploading ? <span>Uploading photo...</span> : null}
        {!isUploading && value ? (
          <span className="text-green-700 dark:text-green-400">
            Photo uploaded for this submission.
          </span>
        ) : null}
        {!isUploading && !value && status.kind === "idle" ? (
          <span className="text-zinc-500">JPEG, PNG, or WebP. Max 5 MB.</span>
        ) : null}
        {!isUploading && !value && status.kind === "selected" ? (
          <span className="text-zinc-600 dark:text-zinc-400">
            {status.name} will upload when you submit.
          </span>
        ) : null}
        {visibleError ? (
          <p id="survey-photo-error" className="whitespace-pre-wrap text-red-600">
            {visibleError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
