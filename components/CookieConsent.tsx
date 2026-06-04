"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "jf-cookie-consent-v1";

type Choice = "accepted" | "essential";

function readStoredChoice(): Choice | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "accepted" || value === "essential") return value;
    return null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (readStoredChoice() === null) setOpen(true);
  }, []);

  function record(choice: Choice) {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {

    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="jf-cookie" role="dialog" aria-label="Cookie preferences">
      <p className="jf-cookie-title">Cookies on Fraser &apos;26</p>
      <p className="jf-cookie-text">
        We use a sign-in cookie to keep you logged in. If we add analytics
        later, it stays off unless you accept. See our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
      <div className="jf-cookie-actions">
        <button
          type="button"
          className="jf-cookie-btn"
          onClick={() => record("essential")}
        >
          Essential only
        </button>
        <button
          type="button"
          className="jf-cookie-btn jf-cookie-btn--primary"
          onClick={() => record("accepted")}
        >
          Accept all
        </button>
      </div>
    </div>
  );
}
