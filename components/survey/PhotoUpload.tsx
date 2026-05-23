"use client";

import { useEffect, useState } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 5 * 1024 * 1024;

type UploadStatus =
  | { kind: "idle" }
  | { kind: "signing" }
  | { kind: "uploading" }
  | { kind: "done"; key: string }
  | { kind: "error"; message: string };

export function PhotoUpload({
  value,
  onUploadedKey,
  publicHost,
  error,
}: {
  value: string;
  onUploadedKey: (key: string) => void;
  publicHost: string;
  error?: string;
}) {
  const [status, setStatus] = useState<UploadStatus>({ kind: "idle" });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const disabled = status.kind === "signing" || status.kind === "uploading";

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFile(file: File) {
    onUploadedKey("");
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

    setStatus({ kind: "signing" });
    let signed: { url: string; key: string; expires_at: string };
    try {
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: file.type,
          content_length: file.size,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`/api/upload-url ${res.status}: ${body}`);
      }
      signed = (await res.json()) as {
        url: string;
        key: string;
        expires_at: string;
      };
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : String(e),
      });
      return;
    }

    setStatus({ kind: "uploading" });
    try {
      const putRes = await fetch(signed.url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        const body = await putRes.text();
        throw new Error(`R2 PUT ${putRes.status}: ${body}`);
      }
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : String(e),
      });
      return;
    }

    onUploadedKey(signed.key);
    setStatus({ kind: "done", key: signed.key });
  }

  const visibleError = status.kind === "error" ? status.message : error;
  const publicUrl =
    status.kind === "done" && publicHost
      ? `https://${publicHost}/${status.key}`
      : null;

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
          disabled={disabled}
          aria-invalid={visibleError ? "true" : undefined}
          aria-describedby={visibleError ? "survey-photo-error" : undefined}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
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
        {status.kind === "idle" ? (
          <span className="text-zinc-500">JPEG, PNG, or WebP. Max 5 MB.</span>
        ) : null}
        {status.kind === "signing" ? <span>Requesting signed URL...</span> : null}
        {status.kind === "uploading" ? <span>Uploading to R2...</span> : null}
        {status.kind === "done" ? (
          <p className="text-green-700 dark:text-green-400">
            Uploaded
            {publicUrl ? (
              <>
                {" "}
                (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  preview
                </a>
                )
              </>
            ) : null}
          </p>
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
