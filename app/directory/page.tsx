import { DirectoryClient } from "@/components/DirectoryClient";
import { getDirectoryPage } from "@/lib/data/directory";

export const metadata = {
  title: "Directory — Class of 2026",
};

export default async function DirectoryPage() {
  const { entries, nextCursor } = await getDirectoryPage();
  return (
    <DirectoryClient initialEntries={entries} initialCursor={nextCursor} />
  );
}
