import { RewindTimeline } from "./RewindTimeline";
import { getRewindEntries } from "@/lib/rewind";

export const metadata = {
  title: "Rewind — Class of 2026",
  description:
    "A look back at the Fraser Class of 2026's four years — letters, photos, and memories from grade 9 to 12.",
};

export default function RewindPage() {
  const entries = getRewindEntries();
  return <RewindTimeline entries={entries} />;
}
