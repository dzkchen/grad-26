"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "jf-cookie-consent-v1";
const CONSENT_EVENT = "jf-cookie-consent-change";

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

function subscribeToConsentChanges(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CONSENT_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CONSENT_EVENT, onChange);
  };
}

function readServerChoice(): Choice {
  return "essential";
}

export function CookieConsent() {
  const storedChoice = useSyncExternalStore(
    subscribeToConsentChanges,
    readStoredChoice,
    readServerChoice,
  );
  const [dismissed, setDismissed] = useState(false);
  const open = !dismissed && storedChoice === null;

  function record(choice: Choice) {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
      window.dispatchEvent(new Event(CONSENT_EVENT));
    } catch {

    }
    setDismissed(true);
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
