import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";

const GRAD_DATE = new Date("2026-06-26T10:00:00-04:00");

const CARDS = [
  {
    href: "/survey",
    title: "Survey",
    body: "Fill out your senior survey",
  },
  {
    href: "/directory",
    title: "Directory",
    body: "Edjd",
  },
  {
    href: "/stats",
    title: "Stats",
    body: "Charts",
  },
  {
    href: "/rewind",
    title: "Rewind",
    body: "A scrolling look",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <section className="text-center sm:text-left">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Class of 2026
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
          John Fraser SS
        </p>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-black/10 p-6 transition hover:border-black/30 hover:bg-black/[.02] dark:border-white/15 dark:hover:border-white/40 dark:hover:bg-white/[.04]"
          >
            <h2 className="text-lg font-semibold tracking-tight">
              {card.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {card.body}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
