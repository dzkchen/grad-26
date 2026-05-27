import { RewindTimeline } from "./RewindTimeline";
import { getRewindEntries } from "@/lib/rewind";

export const metadata = {
  title: "Rewind — Class of 2026",
};

export default function RewindPage() {
  const entries = getRewindEntries();
  return <RewindTimeline entries={entries} />;
}
