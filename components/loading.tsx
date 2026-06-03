"use client";

import { useEffect, useState, type CSSProperties } from "react";

export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={`jf-spinner${className ? ` ${className}` : ""}`}
      role="status"
      aria-label={label}
    />
  );
}

export function SlowLoadingHint({
  delayMs = 4500,
  message = "Still loading… your connection might be slow.",
  className,
}: {
  delayMs?: number;
  message?: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setShow(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);

  if (!show) return null;
  return (
    <p
      className={`jf-slow-hint${className ? ` ${className}` : ""}`}
      role="status"
    >
      {message}
    </p>
  );
}

const DIR_SKELETON_ROTATIONS = [
  "-2deg",
  "1.5deg",
  "-1deg",
  "2.5deg",
  "0.5deg",
  "-1.5deg",
  "2deg",
  "-0.8deg",
  "1.2deg",
  "-2.2deg",
];

export function DirectoryGridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div className="jf-dir-skel-wrap" aria-busy="true" aria-live="polite">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.08) 1px, transparent 1px), linear-gradient(rgba(30,111,217,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.04) 1px, transparent 1px)",
          backgroundSize: "80px 80px, 80px 80px, 16px 16px, 16px 16px",
        }}
      />
      <div className="jf-dir-skel-header">
        <div style={{ flex: "1 1 280px" }}>
          <span
            className="jf-skeleton"
            style={{ display: "block", height: 52, width: "70%", maxWidth: 420 }}
          />
          <span
            className="jf-skeleton"
            style={{ display: "block", height: 12, width: 280, marginTop: 14 }}
          />
        </div>
        <span
          className="jf-skeleton"
          style={{ height: 28, width: 96, borderRadius: 999 }}
        />
      </div>
      <div className="jf-dir-skel-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="jf-dir-skel-card"
            style={
              {
                ["--rot" as string]:
                  DIR_SKELETON_ROTATIONS[i % DIR_SKELETON_ROTATIONS.length],
              } as CSSProperties
            }
          >
            <span className="jf-skeleton jf-dir-skel-photo" />
            <span className="jf-skeleton jf-dir-skel-name" />
            <span className="jf-skeleton jf-dir-skel-sub" />
          </div>
        ))}
      </div>
    </div>
  );
}

const STATS_SKELETON_CARDS: Array<3 | 4 | 5 | 6> = [
  5, 6, 6, 3, 3, 4, 4, 4,
];

export function StatsSkeleton() {
  return (
    <div className="jf-stats" aria-busy="true" aria-live="polite">
      <header className="jf-stats-header">
        <div>
          <span
            className="jf-skeleton"
            style={{ display: "block", height: 12, width: 180 }}
          />
          <span
            className="jf-skeleton"
            style={{
              display: "block",
              height: 80,
              width: 320,
              marginTop: 16,
            }}
          />
          <span
            className="jf-skeleton"
            style={{ display: "block", height: 14, width: 240, marginTop: 14 }}
          />
        </div>
        <div>
          <span
            className="jf-skeleton"
            style={{ display: "block", height: 72, width: 140 }}
          />
          <span
            className="jf-skeleton"
            style={{ display: "block", height: 12, width: 120, marginTop: 8 }}
          />
        </div>
      </header>
      <div className="jf-stats-grid">
        {STATS_SKELETON_CARDS.map((span, i) => (
          <div
            key={i}
            className={`jf-stats-skel-card jf-stats-skel-card-${span}`}
          >
            <span className="jf-skeleton jf-stats-skel-label" />
            <span className="jf-skeleton jf-stats-skel-title" />
            <span className="jf-skeleton jf-stats-skel-body" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SurveyFormSkeleton() {
  return (
    <div className="jf-survey-form-outer" aria-busy="true" aria-live="polite">
      <div className="jf-survey-progress">
        <div
          className="jf-survey-progress-steps"
          aria-hidden="true"
          style={{ opacity: 0.5 }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="jf-skeleton jf-skeleton--dark"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                marginRight: i < 4 ? 8 : 0,
                flex: i < 4 ? "0 0 32px" : undefined,
              }}
            />
          ))}
        </div>
      </div>
      <div className="jf-survey-skel-card">
        <span className="jf-skeleton jf-survey-skel-eyebrow" />
        <span className="jf-skeleton jf-survey-skel-title" />
        <div className="jf-survey-skel-row">
          <span className="jf-skeleton jf-survey-skel-photo" />
          <div className="jf-survey-skel-stack">
            <span className="jf-skeleton jf-survey-skel-line" />
            <span className="jf-skeleton jf-survey-skel-line jf-survey-skel-line--short" />
          </div>
        </div>
        <span className="jf-skeleton jf-survey-skel-line jf-survey-skel-line--tall" />
        <span className="jf-skeleton jf-survey-skel-line" />
        <span className="jf-skeleton jf-survey-skel-line jf-survey-skel-line--short" />
      </div>
    </div>
  );
}

export function AdminTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <header>
        <span
          className="jf-skeleton"
          style={{ display: "block", height: 12, width: 64 }}
        />
        <span
          className="jf-skeleton"
          style={{ display: "block", height: 32, width: 220, marginTop: 12 }}
        />
        <span
          className="jf-skeleton"
          style={{ display: "block", height: 14, width: 360, marginTop: 14 }}
        />
      </header>
      <div className="overflow-x-auto rounded-md border border-black/10 dark:border-white/15">
        <div className="jf-admin-skel">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="jf-admin-skel-row">
              <span className="jf-skeleton jf-admin-skel-photo" />
              <span
                className="jf-skeleton jf-admin-skel-cell"
                style={{ width: "75%" }}
              />
              <span
                className="jf-skeleton jf-admin-skel-cell"
                style={{ width: "90%" }}
              />
              <span
                className="jf-skeleton jf-admin-skel-cell"
                style={{ width: "60%" }}
              />
              <span
                className="jf-skeleton jf-admin-skel-cell"
                style={{ width: "70%" }}
              />
              <span
                className="jf-skeleton jf-admin-skel-cell"
                style={{ width: "80%" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
