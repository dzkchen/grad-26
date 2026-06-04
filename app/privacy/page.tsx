import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Class of 2026",
  description:
    "How Fraser Grads '26 collects, stores, and handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="jf-legal">
      <div className="jf-legal-wrap">
        <h1 className="jf-legal-title">Privacy Policy</h1>

        <div className="jf-legal-body">
          <p>
            This website is an unofficial student project for the John
            Fraser SS Class of 2026 (Not affiliated).
          </p>

          <h2>What we collect</h2>
          <p>
            Only what you choose to submit, plus the minimum needed to sign you
            in:
          </p>
          <ul>
            <li>
              <strong>Account info from Google Sign-In:</strong> your name and email. Sign-in is restricted to{" "}
              <strong>@pdsb.net</strong> accounts.
            </li>
            <li>
              <strong>Survey answers:</strong> display name, photo, optional
              Instagram / LinkedIn handles, and your answers to the senior
              survey questions.
            </li>
          </ul>
          <p>
            No data is sold or shared with third parties
          </p>

          <h2>Where your data is stored</h2>
          <ul>
            <li>
              <strong>Supabase (Postgres):</strong> account records and survey
              answers.
            </li>
            <li>
              <strong>Cloudflare R2:</strong> your uploaded profile photo.
            </li>
            <li>
              <strong>Google:</strong> handles the actual sign-in (we never see
              your password).
            </li>
            <li>
              <strong>Vercel:</strong> hosts the site. Standard server access
              logs (IP, user agent, request path) are produced by the host for
              security and uptime.
            </li>
            <li>
              <strong>Google Cloud Run:</strong> runs the API the site talks to.
            </li>
          </ul>

          <h2>How it&apos;s used</h2>
          <ul>
            <li>To show your entry in the public class directory and stats.</li>
            <li>To let you sign in and edit/remove your entry.</li>
            <li>
              To moderate submissions.
            </li>
          </ul>
          <p>
            Aggregated stats
            (counts, averages) are shown on public stats pages without
            identifiers.
          </p>

          <h2>Cookies</h2>
          <p>The site uses a small number of cookies:</p>
          <ul>
            <li>
              <strong>Essential (always on):</strong> a session cookie set after
              you sign in so the site remembers you. A consent preference is
              stored in your browser&apos;s local storage to remember your
              cookie banner choice.
            </li>
            <li>
              <strong>Analytics (off by default):</strong> I might add basic,
              privacy-friendly analytics (e.g. Vercel Analytics) later to count
              page views. If I do, it only runs after you accept it in the
              cookie banner, and you can change your choice any time by
              re-opening the banner.
            </li>
          </ul>

          <h2>How long it&apos;s kept</h2>
          <p>
            Your entry data is kept until you ask us to
            remove it. Email me at{" "}
            <a href="mailto:dzkchen@gmail.com">dzkchen@gmail.com </a> and I&apos;ll delete your survey entry and uploaded
            photo.
          </p>

          <h2>Contact</h2>
          <p>
            For privacy questions or deletion requests, email{" "}
            <a href="mailto:dzkchen@gmail.com">dzkchen@gmail.com</a>.
          </p>

          <p style={{ marginTop: 28 }}>
            See also: <Link href="/terms">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
