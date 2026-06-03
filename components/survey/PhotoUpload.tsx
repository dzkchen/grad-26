"use client";

import { useEffect, useRef, useState } from "react";
import { SlowLoadingHint, Spinner } from "@/components/loading";

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
  const inputRef = useRef<HTMLInputElement>(null);

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

  function clearPhoto() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onFileSelected(null);
    setStatus({ kind: "idle" });
  }

  const visibleError = status.kind === "error" ? status.message : error;

  return (
    <div className="jf-survey-photo-field">
      <span className="jf-survey-label">Photo</span>
      <div className="jf-survey-photo-frame">
        <label
          htmlFor="survey-photo"
          className={`jf-survey-photo-uploader${previewUrl ? " has-image" : ""}`}
          aria-disabled={isUploading || disabled}
          aria-busy={isUploading}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Selected survey photo preview" />
          ) : null}
          <span className="jf-survey-photo-icon" aria-hidden="true">
            +
          </span>
          <span className="jf-survey-photo-text">Add Photo</span>
          {isUploading ? (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(13,27,75,0.55)",
                color: "var(--jf-white)",
                fontSize: 22,
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
              }}
            >
              <Spinner label="Uploading photo" />
            </span>
          ) : null}
        </label>
        <input
          ref={inputRef}
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
          className="jf-survey-photo-input"
        />
        {previewUrl ? (
          <button
            type="button"
            className="jf-survey-photo-remove"
            aria-label="Remove photo"
            onClick={clearPhoto}
            disabled={isUploading || disabled}
          >
            x
          </button>
        ) : null}
        <input type="hidden" name="photo_key" value={value} />
      </div>

      <div aria-live="polite" className="jf-survey-photo-status">
        {isUploading ? (
          <>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Spinner label="Uploading" />
              Uploading photo…
            </span>
            <SlowLoadingHint
              delayMs={6000}
              message="Still uploading… large photos can take a while."
            />
          </>
        ) : null}
        {!isUploading && value ? <span>Photo uploaded for this submission.</span> : null}
        {!isUploading && !value && status.kind === "idle" ? (
          <span>JPEG, PNG, or WebP. Max 5 MB.</span>
        ) : null}
        {!isUploading && !value && status.kind === "selected" ? (
          <span>{status.name} will upload when you submit.</span>
        ) : null}
        {visibleError ? (
          <p id="survey-photo-error" className="jf-survey-error">
            {visibleError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
