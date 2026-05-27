import { Suspense } from "react";
import { requireUser } from "@/lib/auth";

async function ThanksContent() {
  await requireUser();

  return (
    <div className="jf-survey-form-outer jf-survey-thanks-outer">
      <div className="jf-survey-form-card">
        <section className="jf-survey-success is-active">
          <div className="jf-survey-success-icon" aria-hidden="true">
            🎓
          </div>
          <h1 className="jf-survey-success-title">Information is submitted!</h1>
          <p className="jf-survey-success-sub">Class of 26&apos;</p>
          <p className="jf-survey-success-desc">
            May take up to one day to show on the directory and stats page!
          </p>
          <a href="/directory" className="jf-survey-btn-next">
            View Directory →
          </a>
        </section>
      </div>
    </div>
  );
}

export default function SurveyThanksPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-zinc-500">
          Loading...
        </div>
      }
    >
      <ThanksContent />
    </Suspense>
  );
}
