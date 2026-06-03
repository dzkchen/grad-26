"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { RewindEntry } from "@/lib/rewind";

type YearBucket = {
  year: number;
  grade: string;
  title: string;
  highlight?: boolean;
  entries: RewindEntry[];
};

const YEARS: ReadonlyArray<Omit<YearBucket, "entries">> = [
  { year: 2022, grade: "Gr. 9", title: "FIRST YEAR." },
  { year: 2023, grade: "Gr. 10", title: "YEAR TWO." },
  { year: 2024, grade: "Gr. 11", title: "YEAR THREE." },
  { year: 2025, grade: "Gr. 12", title: "FINAL YEAR.", highlight: true },
];

function bucketEntries(entries: readonly RewindEntry[]): YearBucket[] {
  return YEARS.map((y) => ({
    ...y,
    entries: entries.filter((e) => {
      const d = new Date(`${e.date}T00:00:00`);
      const m = d.getMonth();
      const yr = d.getFullYear();
      const schoolYear = m >= 7 ? yr : yr - 1;
      return schoolYear === y.year;
    }),
  }));
}

export function RewindTimeline({
  entries,
}: {
  entries: readonly RewindEntry[];
}) {
  const buckets = bucketEntries(entries);
  const spineRef = useRef<HTMLDivElement | null>(null);
  const spineFillRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const spine = spineRef.current;
    const spineFill = spineFillRef.current;
    const root = rootRef.current;
    if (!spine || !spineFill || !root) return;

    const updateSpine = () => {
      const rect = spine.getBoundingClientRect();
      const spineTop = rect.top + window.scrollY;
      const spineH = spine.offsetHeight;
      const scrolled = window.scrollY + window.innerHeight * 0.6;
      const pct = Math.max(
        0,
        Math.min(100, ((scrolled - spineTop) / spineH) * 100),
      );
      spineFill.style.height = pct + "%";
    };

    const yearObserver = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in-view");
        });
      },
      { threshold: 0.15 },
    );
    root
      .querySelectorAll<HTMLElement>("[data-year-block]")
      .forEach((b) => yearObserver.observe(b));

    const memObserver = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    root
      .querySelectorAll<HTMLElement>("[data-mem-item]")
      .forEach((m) => memObserver.observe(m));

    window.addEventListener("scroll", updateSpine, { passive: true });
    updateSpine();

    return () => {
      window.removeEventListener("scroll", updateSpine);
      yearObserver.disconnect();
      memObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen overflow-x-hidden bg-jf-paper text-jf-ink"
    >
      {/* subtle grid bg */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* PAGE HEADER */}
      <header className="relative z-10 flex flex-wrap items-end justify-between gap-8 px-13 pt-16 pb-14">
        <div>
          <h1
            className="font-display leading-[0.88] tracking-[0.02em] text-jf-navy"
            style={{ fontSize: "clamp(64px, 10vw, 128px)" }}
          >
            RE<span className="text-jf-blue">WIND</span>
          </h1>
        </div>
        <div
          className="font-display text-right leading-none tracking-[0.04em]"
          style={{
            fontSize: "72px",
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(30,111,217,0.18)",
          }}
        >
          2022
          <br />—<br />
          2026
        </div>
      </header>

      {/* TIMELINE */}
      <div
        className="relative z-10 px-13 pb-30"
        style={{ ["--spine" as string]: "80px" }}
      >
        <div
          ref={spineRef}
          className="absolute top-0 bottom-30 z-0 w-[2px] bg-[#DDE2F0]"
          style={{ left: "calc(52px + var(--spine))" }}
        >
          <div
            ref={spineFillRef}
            className="absolute top-0 left-0 h-0 w-full transition-[height] duration-100"
            style={{
              background:
                "linear-gradient(180deg, var(--jf-blue) 0%, var(--jf-blue-light) 100%)",
            }}
          />
        </div>

        {buckets.map((b) => (
          <YearBlock key={b.year} bucket={b} />
        ))}
      </div>

      {/* CTA */}
      <div className="flex flex-wrap items-center justify-between gap-6 bg-jf-navy px-13 py-16">
        <div>
          <div className="font-display text-[48px] leading-none tracking-[0.02em] text-white">
            Your memory
            <br />
            <span className="text-jf-blue-light">goes here.</span>
          </div>
          <div className="mt-2 text-[16px] font-light text-white/45 italic">
            Fill out the survey to add your voice to the class story.
          </div>
        </div>
        <Link
          href="/survey"
          className="bg-white px-9 py-4 text-[15px] font-bold whitespace-nowrap text-jf-navy transition-transform duration-150 hover:-translate-y-0.5 hover:bg-jf-paper"
        >
          Take the Survey →
        </Link>
      </div>

      <style jsx>{`
        :global([data-year-block]) {
          position: relative;
          margin-bottom: 96px;
          padding-left: calc(var(--spine, 80px) + 40px);
        }
        :global([data-year-node]) {
          position: absolute;
          left: calc(var(--spine, 80px) - 11px);
          top: 8px;
          width: 24px;
          height: 24px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #dde2f0;
          z-index: 2;
          transition: border-color 0.4s, background 0.4s, box-shadow 0.4s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        :global([data-year-node-inner]) {
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          background: #dde2f0;
          transition: background 0.4s;
        }
        :global([data-year-block].in-view [data-year-node]) {
          border-color: var(--jf-blue);
          box-shadow: 0 0 0 5px rgba(30, 111, 217, 0.12);
        }
        :global([data-year-block].in-view [data-year-node-inner]) {
          background: var(--jf-blue);
        }
        :global([data-year-num]) {
          opacity: 0.3;
          transition: opacity 0.4s;
        }
        :global([data-year-block].in-view [data-year-num]) {
          opacity: 1;
        }
        :global([data-year-heading]) {
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        :global([data-year-block].in-view [data-year-heading]) {
          opacity: 1;
          transform: translateY(0);
        }
        :global([data-mem-item]) {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.55s ease, transform 0.55s ease;
          transition-delay: var(--delay, 0s);
        }
        :global([data-mem-item].is-visible) {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

function YearBlock({ bucket }: { bucket: YearBucket }) {
  const { year, grade, title, highlight, entries } = bucket;
  return (
    <div data-year-block id={`y${year}`}>
      <div
        className="absolute top-1 text-right"
        style={{ left: 0, width: "calc(var(--spine, 80px) - 20px)" }}
      >
        <span className="block text-[10px] font-bold tracking-[0.1em] text-jf-blue uppercase">
          {grade}
        </span>
        <div
          data-year-num
          className="font-display text-[28px] leading-none text-jf-navy"
          style={highlight ? { color: "var(--jf-blue)", opacity: 1 } : undefined}
        >
          {year}
        </div>
      </div>

      <div data-year-node>
        <div data-year-node-inner />
      </div>

      <div data-year-heading className="mb-7">
        <div
          className="font-display leading-[0.95] tracking-[0.02em] text-jf-navy"
          style={{
            fontSize: "clamp(40px, 5vw, 64px)",
            color: highlight ? "var(--jf-blue)" : undefined,
          }}
        >
          {title}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="flex items-center gap-4 py-10 pt-10 pb-5">
          <div className="h-px flex-1 bg-[#DDE2F0]" />
          <span className="text-[11px] font-semibold tracking-[0.14em] whitespace-nowrap text-[rgba(13,27,75,0.4)] opacity-50 uppercase">
            Coming soon
          </span>
          <div className="h-px flex-1 bg-[#DDE2F0]" />
        </div>
      ) : (
        <div className="mb-5 flex flex-wrap items-start gap-4">
          {entries.map((e, i) => (
            <Polaroid key={`${e.date}-${e.image}`} entry={e} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

const ROTATIONS = [-2.5, 1.5, -1, 2, -2, 1, 2.5, -1.5];

function Polaroid({ entry, index }: { entry: RewindEntry; index: number }) {
  const r = ROTATIONS[index % ROTATIONS.length];
  return (
    <figure
      data-mem-item
      className="flex-shrink-0"
      style={
        {
          ["--delay" as string]: `${(index % 6) * 0.06}s`,
        } as React.CSSProperties
      }
    >
      <div
        className="relative cursor-default bg-white px-2 pt-2 pb-7 transition-[transform,box-shadow] duration-200 hover:z-10 hover:translate-y-[-4px] hover:scale-105 hover:rotate-0"
        style={{
          transform: `rotate(${r}deg)`,
          boxShadow:
            "0 4px 18px rgba(13,27,75,0.11), 0 1px 4px rgba(13,27,75,0.06)",
          transitionTimingFunction: "cubic-bezier(.34,1.4,.64,1)",
        }}
      >
        <span
          className="absolute z-[3] block"
          style={{
            top: "-9px",
            left: "50%",
            width: "44px",
            height: "16px",
            transform: "translateX(-50%) rotate(1.5deg)",
            background: "rgba(255,220,100,0.55)",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.image}
          alt={entry.caption ?? entry.title}
          className="block h-[180px] w-[180px] object-cover"
          loading="lazy"
        />
        <figcaption className="absolute right-0 bottom-[7px] left-0 text-center text-[11px] font-medium text-jf-ink">
          {entry.title}
        </figcaption>
      </div>
    </figure>
  );
}
