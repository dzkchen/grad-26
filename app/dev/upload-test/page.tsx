import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { UploadTestClient } from "./upload-test-client";

export default async function UploadTestPage() {
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") notFound();
  }

  const publicHost = process.env.R2_PUBLIC_HOSTNAME ?? "";

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold mb-4">Upload pipeline test</h1>
      <p className="text-sm text-gray-600 mb-6">
        Dev/admin-only. Pick a JPEG/PNG/WebP under 5&nbsp;MB; it&rsquo;s signed
        by the Go API and uploaded directly to R2.
      </p>
      <UploadTestClient publicHost={publicHost} />
    </main>
  );
}
