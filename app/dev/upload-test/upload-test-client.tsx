"use client";

import { useState } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 5 * 1024 * 1024;

type Status =
  | { kind: "idle" }
  | { kind: "signing" }
  | { kind: "uploading" }
  | { kind: "done"; publicUrl: string; key: string }
  | { kind: "error"; message: string };

export function UploadTestClient({ publicHost }: { publicHost: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      setStatus({
        kind: "error",
        message: `Unsupported type: ${file.type}. Use JPEG, PNG, or WebP.`,
      });
      return;
    }
    if (file.size < 1 || file.size > MAX_BYTES) {
      setStatus({
        kind: "error",
        message: `Size ${file.size} bytes — must be 1..${MAX_BYTES}.`,
      });
      return;
    }

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
      signed = await res.json();
    } catch (e) {
      setStatus({ kind: "error", message: String(e) });
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
      setStatus({ kind: "error", message: String(e) });
      return;
    }

    const publicUrl = publicHost
      ? `https://${publicHost}/${signed.key}`
      : signed.key;
    setStatus({ kind: "done", publicUrl, key: signed.key });
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="upload-test-file"
          className="block text-sm font-medium mb-1"
        >
          Photo
        </label>
        <input
          id="upload-test-file"
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          disabled={status.kind === "signing" || status.kind === "uploading"}
          className="block"
        />
      </div>

      <div aria-live="polite" className="text-sm">
        {status.kind === "idle" && <span className="text-gray-500">Ready.</span>}
        {status.kind === "signing" && <span>Requesting signed URL…</span>}
        {status.kind === "uploading" && <span>Uploading to R2…</span>}
        {status.kind === "error" && (
          <span className="text-red-600 whitespace-pre-wrap">
            Error: {status.message}
          </span>
        )}
        {status.kind === "done" && (
          <div className="space-y-2">
            <p className="text-green-700">Uploaded.</p>
            <p>
              key: <code className="font-mono">{status.key}</code>
            </p>
            <p>
              public URL:{" "}
              <a
                href={status.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                {status.publicUrl}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
