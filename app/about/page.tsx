import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About — Class of 2026",
  description:
    "About the Grad-26 senior class site for John Fraser SS — built by David Chen as a keepsake for the Class of 2026.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[65ch] px-4 py-12">
      <header className="mb-10">
        <p className="text-sm font-medium text-zinc-500">Class of 2026</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">About</h1>
      </header>

      <section className="mb-10 flex items-center gap-5">
        <Image
          src="/about/me.jpg"
          alt="David Chen, creator of Grad-26"
          width={72}
          height={72}
          sizes="72px"
          priority
          className="rounded-full object-cover"
        />
        <div>
          <p className="font-semibold">David Chen</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Creator &amp; maintainer
          </p>
        </div>
      </section>

      <section className="space-y-4 text-zinc-700 dark:text-zinc-300">
        <p>
          placeholder
        </p>
        <p>
          g
        </p>
        <p>
          d
        </p>
        <p className="font-medium text-foreground">
          g
        </p>
      </section>

      <section className="mt-10 space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Get in touch</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This is a personal project built to learn web development. If you have
          questions, concerns, or want to help contribute, reach out on Instagram{" "}
          <a
            href="https://www.instagram.com/zkc.david"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            @zkc.david
          </a>
          .
        </p>
      </section>
    </div>
  );
}
