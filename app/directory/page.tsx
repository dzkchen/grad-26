import { DirectoryClient } from "@/components/DirectoryClient";
import { getDirectoryPage } from "@/lib/data/directory";

export const metadata = {
  title: "Directory — Class of 2026",
  description:
    "Browse the John Fraser SS Class of 2026 — photos, quotes, and where each grad is headed next.",
  robots: { index: false },
};

export default async function DirectoryPage() {
  const { entries, nextCursor } = await getDirectoryPage();
  return (
    <DirectoryClient initialEntries={entries} initialCursor={nextCursor} />
  );
}
