"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
import type { DirectoryEntry, DirectoryPage } from "@/lib/data/directory";

const ROTATIONS = [
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

type Plan = "all" | "university" | "college" | "gap" | "work";

const FILTER_OPTIONS: ReadonlyArray<{ key: Plan; label: string }> = [
  { key: "all", label: "All" },
  { key: "university", label: "University" },
  { key: "college", label: "College" },
  { key: "gap", label: "Gap Year" },
  { key: "work", label: "Work" },
];

function detectPlan(entry: DirectoryEntry): Plan {
  const text = (
    (entry.details?.whats_next ?? "") +
    " " +
    (entry.details?.school_workplace ?? "")
  ).toLowerCase();
  if (text.includes("gap")) return "gap";
  if (text.includes("university") || /\buni\b/.test(text)) return "university";
  if (text.includes("college")) return "college";
  if (
    text.includes("work") ||
    text.includes("job") ||
    text.includes("employ") ||
    text.includes("full-time") ||
    text.includes("full time")
  ) {
    return "work";
  }
  return "all";
}

function linkedinHref(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://www.linkedin.com/in/${encodeURIComponent(value)}`;
}

export function DirectoryClient({
  initialEntries,
  initialCursor,
}: {
  initialEntries: DirectoryEntry[];
  initialCursor: string | null;
}) {
  const [entries, setEntries] = useState<DirectoryEntry[]>(initialEntries);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingMore, startLoadingMore] = useTransition();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Plan>("all");
  const [activeEntry, setActiveEntry] = useState<DirectoryEntry | null>(null);
  const [displayedEntry, setDisplayedEntry] = useState<DirectoryEntry | null>(
    null,
  );
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const taggedEntries = useMemo(
    () => entries.map((entry) => ({ entry, plan: detectPlan(entry) })),
    [entries],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return taggedEntries.filter(({ entry, plan }) => {
      const matchFilter = filter === "all" || plan === filter;
      const matchSearch = !q || entry.display_name.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [taggedEntries, filter, search]);

  const loadMore = useCallback(() => {
    if (!cursor) return;
    setLoadError(null);
    const next = cursor;
    startLoadingMore(async () => {
      try {
        const res = await fetch(
          `/api/directory?cursor=${encodeURIComponent(next)}`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          setLoadError(`Failed to load more (${res.status}).`);
          return;
        }
        const page = (await res.json()) as DirectoryPage;
        setEntries((prev) => [...prev, ...page.entries]);
        setCursor(page.nextCursor);
      } catch {
        setLoadError("Failed to load more.");
      }
    });
  }, [cursor]);

  const openModal = useCallback((entry: DirectoryEntry) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setActiveEntry(entry);
    setDisplayedEntry(entry);
  }, []);

  const closeModal = useCallback(() => {
    setActiveEntry(null);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setDisplayedEntry(null);
      closeTimerRef.current = null;
    }, 400);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeModal]);

  useEffect(() => {
    if (!activeEntry) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [activeEntry]);

  const isOpen = activeEntry !== null;
  const entryForModal = displayedEntry;

  return (
    <div className="relative isolate min-h-[calc(100vh-80px)] overflow-x-hidden bg-[var(--jf-paper)] font-sans text-[var(--jf-ink)]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.08) 1px, transparent 1px), linear-gradient(rgba(30,111,217,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.04) 1px, transparent 1px)",
          backgroundSize: "80px 80px, 80px 80px, 16px 16px, 16px 16px",
        }}
      />

      <header className="relative z-[1] flex flex-wrap items-end justify-between gap-6 px-6 pt-14 pb-8 md:px-12">
        <div className="min-w-0">
          <h1 className="text-[clamp(36px,5vw,64px)] leading-[1] font-bold tracking-[-0.03em] text-[var(--jf-navy)]">
            The Class of{" "}
            <span className="text-[clamp(28px,4vw,52px)] font-light italic text-[var(--jf-blue)]">
              &apos;26
            </span>
          </h1>
          <p className="mt-2.5 text-[15px] text-[rgba(13,27,75,0.5)]">
            Find a friend. Relive a memory. See where everyone&apos;s headed.
          </p>
        </div>
        <span className="rounded-full border border-[rgba(30,111,217,0.2)] bg-[rgba(30,111,217,0.1)] px-4 py-1.5 text-sm font-semibold text-[var(--jf-blue)]">
          {filtered.length} grad{filtered.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="relative z-[1] flex flex-wrap items-center gap-4 px-6 pb-8 md:px-12">
        <div className="relative min-w-[260px] max-w-[480px] flex-1">
          <span
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-[rgba(13,27,75,0.5)]"
          >
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            aria-label="Search by name"
            className="w-full rounded-full border-[1.5px] border-[rgba(30,111,217,0.2)] bg-white py-3 pr-4 pl-11 text-[15px] text-[var(--jf-ink)] shadow-[0_2px_8px_rgba(13,27,75,0.06)] outline-none transition placeholder:text-[rgba(13,27,75,0.5)] focus:border-[var(--jf-blue)] focus:shadow-[0_0_0_3px_rgba(30,111,217,0.12)]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => {
            const active = filter === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setFilter(opt.key)}
                aria-pressed={active}
                className={
                  active
                    ? "cursor-pointer rounded-full border-[1.5px] border-[var(--jf-navy)] bg-[var(--jf-navy)] px-[18px] py-2 text-[13px] font-medium tracking-[0.04em] text-white shadow-[0_2px_6px_rgba(13,27,75,0.05)] transition"
                    : "cursor-pointer rounded-full border-[1.5px] border-[rgba(30,111,217,0.2)] bg-white px-[18px] py-2 text-[13px] font-medium tracking-[0.04em] text-[rgba(13,27,75,0.5)] shadow-[0_2px_6px_rgba(13,27,75,0.05)] transition hover:border-[var(--jf-navy)] hover:bg-[var(--jf-navy)] hover:text-white"
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-[1] px-4 pb-20 md:px-8">
        {filtered.length === 0 ? (
          <p className="py-20 text-center text-lg font-light italic text-[rgba(13,27,75,0.5)]">
            {entries.length === 0
              ? "No one's signed up yet. Be the first to fill out the survey 🎓"
              : "No one found… yet! 🎓"}
          </p>
        ) : (
          <div className="grid gap-x-4 gap-y-6 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]">
            {filtered.map(({ entry }, i) => {
              const rot = ROTATIONS[i % ROTATIONS.length];
              const destSnippet = entry.details?.whats_next
                ? entry.details.whats_next.split(" ").slice(0, 3).join(" ")
                : "";
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => openModal(entry)}
                  style={{ ["--rot" as string]: rot } as CSSProperties}
                  className="group relative block cursor-pointer bg-white p-2.5 pb-7 text-left shadow-[0_4px_16px_rgba(13,27,75,0.12),0_1px_4px_rgba(13,27,75,0.08)] transition-transform duration-[250ms] ease-[cubic-bezier(.34,1.56,.64,1)] will-change-transform [transform:rotate(var(--rot))] hover:z-10 hover:shadow-[0_16px_40px_rgba(13,27,75,0.2),0_4px_12px_rgba(13,27,75,0.12)] hover:[transform:rotate(0deg)_scale(1.06)_translateY(-6px)] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--jf-blue)]"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-[var(--jf-paper-dark)]">
                    <Image
                      src={entry.photo_url}
                      alt={`${entry.display_name} photo`}
                      fill
                      sizes="(min-width: 1024px) 200px, (min-width: 640px) 25vw, 45vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-1.5 text-center text-[13px] leading-none font-semibold text-[var(--jf-ink)]">
                    {entry.display_name.split(" ")[0]}
                  </div>
                  {destSnippet ? (
                    <div className="mt-1 text-center text-[11px] font-light italic text-[rgba(13,27,75,0.5)]">
                      {destSnippet}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        {cursor ? (
          <div className="mt-12 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={loadMore}
              disabled={isLoadingMore}
              className="cursor-pointer rounded-full border-[1.5px] border-[rgba(30,111,217,0.2)] bg-white px-6 py-2.5 text-sm font-medium tracking-[0.04em] text-[var(--jf-navy)] shadow-[0_2px_8px_rgba(13,27,75,0.06)] transition hover:border-[var(--jf-navy)] hover:bg-[var(--jf-navy)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[rgba(30,111,217,0.2)] disabled:hover:bg-white disabled:hover:text-[var(--jf-navy)]"
            >
              {isLoadingMore ? "Loading…" : "Load more"}
            </button>
            {loadError ? (
              <p className="text-sm text-red-600">{loadError}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
        aria-hidden={!isOpen}
        className={
          isOpen
            ? "fixed inset-0 z-[200] flex items-end justify-center bg-[rgba(13,27,75,0.55)] opacity-100 backdrop-blur-[6px] transition-opacity duration-300 ease-out"
            : "pointer-events-none fixed inset-0 z-[200] flex items-end justify-center bg-[rgba(13,27,75,0.55)] opacity-0 backdrop-blur-[6px] transition-opacity duration-300 ease-out"
        }
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="directory-modal-title"
          style={{ borderRadius: "6px 24px 0 0" }}
          className={
            isOpen
              ? "relative max-h-[90vh] w-full max-w-[680px] translate-y-0 overflow-y-auto bg-white shadow-[0_-12px_48px_rgba(13,27,75,0.25)] transition-transform duration-[400ms] ease-[cubic-bezier(.34,1.2,.64,1)]"
              : "relative max-h-[90vh] w-full max-w-[680px] translate-y-full overflow-y-auto bg-white shadow-[0_-12px_48px_rgba(13,27,75,0.25)] transition-transform duration-[400ms] ease-[cubic-bezier(.34,1.2,.64,1)]"
          }
        >
          <div className="mx-auto mt-3.5 h-1 w-10 rounded bg-[rgba(13,27,75,0.15)]" />
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close"
            className="absolute right-5 top-5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[var(--jf-paper)] text-lg text-[var(--jf-ink)] transition hover:bg-[var(--jf-paper-dark)]"
          >
            ✕
          </button>
          {entryForModal ? <ModalBody entry={entryForModal} /> : null}
        </div>
      </div>
    </div>
  );
}

function ModalBody({ entry }: { entry: DirectoryEntry }) {
  const instagram = entry.socials?.instagram;
  const linkedin = entry.socials?.linkedin;
  const d = entry.details ?? {};
  const hasStats = Boolean(d.program_major || d.school_workplace);
  const hasLinks = Boolean(instagram || linkedin);

  return (
    <div className="px-6 pt-6 pb-10 md:px-8">
      <div className="mb-7 flex flex-col items-start gap-6 sm:flex-row">
        <div
          className="w-[140px] shrink-0 bg-white p-2 pb-6 shadow-[0_6px_24px_rgba(13,27,75,0.15)]"
          style={{ transform: "rotate(-2deg)" }}
        >
          <div className="relative aspect-square w-full overflow-hidden bg-[var(--jf-paper-dark)]">
            <Image
              src={entry.photo_url}
              alt={`${entry.display_name} photo`}
              fill
              sizes="140px"
              className="object-cover"
            />
          </div>
          <div className="mt-1 text-center text-[13px] font-medium text-[var(--jf-ink)]">
            {entry.display_name.split(" ")[0]}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id="directory-modal-title"
            className="text-[32px] leading-[1.1] font-bold tracking-[-0.02em] text-[var(--jf-navy)]"
          >
            {entry.display_name}
          </h2>
          {d.whats_next ? (
            <div className="mt-1 text-[14px] font-medium tracking-[0.04em] uppercase text-[var(--jf-blue)]">
              {d.whats_next}
            </div>
          ) : null}
          {d.senior_quote ? (
            <blockquote className="mt-3.5 rounded-r-lg border-l-[3px] border-[var(--jf-blue)] bg-[var(--jf-paper)] px-[18px] py-3.5 text-[16px] leading-[1.5] font-light italic text-[var(--jf-ink)]">
              &ldquo;{d.senior_quote}&rdquo;
            </blockquote>
          ) : null}
        </div>
      </div>

      {hasStats ? (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {d.program_major ? (
            <div className="rounded bg-[var(--jf-paper)] px-4 py-3.5">
              <div className="mb-1 text-[11px] font-semibold tracking-[0.1em] uppercase text-[rgba(13,27,75,0.5)]">
                Program
              </div>
              <div className="text-base font-semibold text-[var(--jf-navy)]">
                {d.program_major}
              </div>
            </div>
          ) : null}
          {d.school_workplace ? (
            <div className="rounded bg-[var(--jf-paper)] px-4 py-3.5">
              <div className="mb-1 text-[11px] font-semibold tracking-[0.1em] uppercase text-[rgba(13,27,75,0.5)]">
                School / Workplace
              </div>
              <div className="text-base font-semibold text-[var(--jf-navy)]">
                {d.school_workplace}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {hasLinks ? (
        <div className="mt-5 flex flex-wrap gap-2.5">
          {instagram ? (
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(30,111,217,0.2)] bg-[rgba(30,111,217,0.08)] px-4 py-2 text-[13px] font-medium text-[var(--jf-blue)] transition hover:border-[rgba(30,111,217,0.4)] hover:bg-[rgba(30,111,217,0.16)]"
            >
              📷 @{instagram}
            </a>
          ) : null}
          {linkedin ? (
            <a
              href={linkedinHref(linkedin)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(13,27,75,0.15)] bg-[rgba(13,27,75,0.06)] px-4 py-2 text-[13px] font-medium text-[var(--jf-navy)] transition hover:border-[rgba(13,27,75,0.3)] hover:bg-[rgba(13,27,75,0.12)]"
            >
              💼 LinkedIn
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
