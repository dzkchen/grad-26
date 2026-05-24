"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { goClient } from "@/lib/go-client";

export type DirectoryEntry = {
  id: string;
  display_name: string;
  photo_url: string;
  socials: { instagram?: string } | null;
  details: {
    whats_next?: string;
    program_major?: string;
    school_workplace?: string;
    senior_quote?: string;
  };
};

export type DirectoryPage = {
  entries: DirectoryEntry[];
  nextCursor: string | null;
};

type GoDirectoryResponse = {
  entries: DirectoryEntry[];
  next_cursor: string | null;
};

export async function getDirectoryPage(cursor?: string): Promise<DirectoryPage> {
  cacheLife("hours");
  cacheTag("directory");
  const data = await goClient.get<GoDirectoryResponse>("/directory", { cursor });
  return { entries: data.entries, nextCursor: data.next_cursor };
}
