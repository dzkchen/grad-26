"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { DirectoryEntry } from "@/lib/data/directory";

export function DirectoryCard({ entry }: { entry: DirectoryEntry }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function open() {
    dialogRef.current?.showModal();
  }
  function close() {
    dialogRef.current?.close();
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function onClick(e: MouseEvent) {
      if (e.target === dialog) close();
    }
    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, []);

  const instagram = entry.socials?.instagram;
  const d = entry.details ?? {};
  const hasDetails =
    d.whats_next || d.school_workplace || d.program_major || d.senior_quote || instagram;

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="group block w-full overflow-hidden rounded-xl border border-black/10 bg-white/50 text-left transition hover:border-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-black dark:border-white/15 dark:bg-white/[.02] dark:hover:border-white/40 dark:focus-visible:ring-white"
      >
        <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-900">
          <Image
            src={entry.photo_url}
            alt={`${entry.display_name} photo`}
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 25vw, 50vw"
            className="object-cover transition group-hover:scale-[1.02]"
          />
        </div>
        <div className="p-4">
          <h3 className="truncate text-base font-semibold tracking-tight">
            {entry.display_name}
          </h3>
        </div>
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[min(560px,92vw)] rounded-xl border border-black/10 bg-white p-0 text-black shadow-2xl backdrop:bg-black/50 dark:border-white/15 dark:bg-zinc-950 dark:text-white"
      >
        <div className="flex flex-col gap-5 p-6 sm:flex-row">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-100 sm:w-40 sm:shrink-0 dark:bg-zinc-900">
            <Image
              src={entry.photo_url}
              alt={`${entry.display_name} photo`}
              fill
              sizes="(min-width: 640px) 160px, 92vw"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                {entry.display_name}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-md border border-black/10 px-2 py-1 text-sm hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
              >
                Close
              </button>
            </div>

            {hasDetails ? (
              <dl className="mt-4 grid gap-3 text-sm">
                {d.whats_next ? (
                  <div>
                    <dt className="text-zinc-500">Next year</dt>
                    <dd>{d.whats_next}</dd>
                  </div>
                ) : null}
                {d.school_workplace ? (
                  <div>
                    <dt className="text-zinc-500">School / Workplace</dt>
                    <dd>{d.school_workplace}</dd>
                  </div>
                ) : null}
                {d.program_major ? (
                  <div>
                    <dt className="text-zinc-500">Program / Major</dt>
                    <dd>{d.program_major}</dd>
                  </div>
                ) : null}
                {instagram ? (
                  <div>
                    <dt className="text-zinc-500">Instagram</dt>
                    <dd>
                      <a
                        href={`https://instagram.com/${instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        @{instagram}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {d.senior_quote ? (
                  <div>
                    <dt className="text-zinc-500">Senior quote</dt>
                    <dd className="whitespace-pre-wrap italic">
                      &ldquo;{d.senior_quote}&rdquo;
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                No additional details provided.
              </p>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
