import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getRewindEntries } from "./rewind.ts";

const REPO_ROOT = join(import.meta.dirname, "..");

test("rewind entries load and validate without throwing", () => {
  const entries = getRewindEntries();
  assert.ok(Array.isArray(entries));
});

test("rewind entries are sorted by date ascending", () => {
  const entries = getRewindEntries();
  for (let i = 1; i < entries.length; i++) {
    assert.ok(
      entries[i - 1].date <= entries[i].date,
      `entry ${i} (${entries[i].date}) is before entry ${i - 1} (${entries[i - 1].date})`,
    );
  }
});

test("every rewind image exists under /public", () => {
  const entries = getRewindEntries();
  for (const entry of entries) {
    const abs = join(REPO_ROOT, "public", entry.image);
    assert.ok(
      existsSync(abs),
      `missing image for ${entry.date} "${entry.title}": ${entry.image}`,
    );
  }
});
