"use client";

import Link from "next/link";
import { HeroBackground } from "@/components/HeroBackground";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    const summary = error.digest
      ? `${error.message} (digest: ${error.digest})`
      : error.message;

    console.error(`App route error: ${summary}`);
    if (typeof error.stack === "string" && error.stack.length > 0) {
      console.error(error.stack);
    }
  }, [error]);

  return (
    <div className="jf-home">
      <section className="jf-hero">
        <HeroBackground />
        <div className="jf-hero-content">
          <div className="jf-hero-big">
            ERR<span className="jf-yr">OR</span>
          </div>
          <p className="jf-hero-tagline">Something went wrong.</p>
          <div className="jf-hero-actions">
            <button className="jf-btn-white" onClick={unstable_retry}>
              Try Again →
            </button>
            <Link href="/" className="jf-btn-ghost">
              Go Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
