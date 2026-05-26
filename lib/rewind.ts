import rewind from "../content/rewind.json" with { type: "json" };

export type RewindEntry = {
  date: string;
  title: string;
  caption?: string;
  image: string;
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validate(raw: unknown): RewindEntry[] {
  if (!Array.isArray(raw)) {
    throw new Error("content/rewind.json: root must be an array.");
  }

  const now = Date.now();
  const entries: RewindEntry[] = [];

  raw.forEach((entry, i) => {
    const where = `content/rewind.json[${i}]`;
    if (entry === null || typeof entry !== "object") {
      throw new Error(`${where}: entry must be an object.`);
    }
    const e = entry as Record<string, unknown>;

    if (typeof e.date !== "string" || !ISO_DATE_RE.test(e.date)) {
      throw new Error(
        `${where}.date: ${JSON.stringify(e.date)} is not an ISO 8601 date (YYYY-MM-DD).`,
      );
    }
    const ts = Date.parse(e.date);
    if (Number.isNaN(ts)) {
      throw new Error(`${where}.date: ${JSON.stringify(e.date)} is unparseable.`);
    }
    if (ts > now) {
      throw new Error(`${where}.date: ${e.date} is in the future.`);
    }

    if (typeof e.title !== "string" || e.title.trim() === "") {
      throw new Error(`${where}.title: must be a non-empty string.`);
    }
    if (e.caption !== undefined && typeof e.caption !== "string") {
      throw new Error(`${where}.caption: must be a string if present.`);
    }
    if (typeof e.image !== "string" || !e.image.startsWith("/rewind/")) {
      throw new Error(
        `${where}.image: ${JSON.stringify(e.image)} must be a path under /rewind/.`,
      );
    }

    entries.push({
      date: e.date,
      title: e.title,
      caption: e.caption as string | undefined,
      image: e.image,
    });
  });

  return entries;
}

const VALIDATED: readonly RewindEntry[] = Object.freeze(
  validate(rewind).sort((a, b) => a.date.localeCompare(b.date)),
);

export function getRewindEntries(): readonly RewindEntry[] {
  return VALIDATED;
}
