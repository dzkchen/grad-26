import Image from "next/image";
import type { RewindEntry } from "@/lib/rewind";

const DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 800;

export function TimelineEntry({
  entry,
  priority,
}: {
  entry: RewindEntry;
  priority: boolean;
}) {
  const label = DATE_FORMAT.format(new Date(`${entry.date}T00:00:00`));
  const alt = entry.caption ?? entry.title;

  return (
    <article className="flex flex-col gap-3">
      <header>
        <time
          dateTime={entry.date}
          className="text-sm font-medium text-zinc-500"
        >
          {label}
        </time>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">
          {entry.title}
        </h2>
      </header>
      <div className="overflow-hidden rounded-xl border border-black/10 bg-zinc-100 dark:border-white/15 dark:bg-zinc-900">
        <Image
          src={entry.image}
          alt={alt}
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          sizes="(min-width: 768px) 720px, 100vw"
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className="h-auto w-full"
        />
      </div>
      {entry.caption ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {entry.caption}
        </p>
      ) : null}
    </article>
  );
}
