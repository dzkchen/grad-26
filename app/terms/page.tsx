import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Class of 2026",
  description:
    "Rules for using Fraser Grads '26 — the unofficial Fraser Class of 2026 site.",
};

export default function TermsPage() {
  return (
    <div className="jf-legal">
      <div className="jf-legal-wrap">
        <h1 className="jf-legal-title">Terms of Service</h1>

        <div className="jf-legal-body">
          <p>
            By using Fraser Grads &apos;26 you agree to these terms (just in case cause chatgpt told me to do a TOS and privacy policy)
          </p>

          <h2>What this site is</h2>
          <p>
            Fraser Grads &apos;26 is an <strong>unofficial</strong>, student-run
            project for the John Fraser SS Class of 2026. It is{" "}
            <strong>
              not affiliated with, endorsed by, or operated by John Fraser SS or
              the Peel District School Board
            </strong>
            . Sign-in is restricted to pdsb.net Google accounts only to keep the
            audience contained.
          </p>

          <h2>Acceptable use</h2>
          <p>Don&apos;t do any of this:</p>
          <ul>
            <li>
              Submit content about other people without their permission, or
              impersonate anyone.
            </li>
            <li>
              Submit hateful, harassing, sexual, threatening, illegal, or
              otherwise hostile content. Slurs and targeted insults are not
              welcome.
            </li>
            <li>
              Upload photos you don&apos;t have the right to use, or that
              contain other people who haven&apos;t agreed to be there.
            </li>
            <li>
              Try to break, overload, scrape, or get around the security or
              sign-in restrictions of the site.
            </li>
            <li>
              Use the directory or any data from the site to spam, advertise,
              dox, or contact classmates in ways they didn&apos;t consent to.
            </li>
          </ul>

          <h2>Your content</h2>
          <p>
            You keep ownership of what you submit. By submitting, you grant
            permission to display it on the site (directory, stats, and similar
            pages) to other signed-in classmates and, where you&apos;ve agreed,
            to the public. You can ask to remove your entry at any time —
            see the Privacy Policy for how.
          </p>

          <h2>Moderation and removal</h2>
          <p>
            I may remove entries, photos, or accounts that break these terms,
            with or without notice. I may also hide entries while reviewing
            them. If I remove something of yours by mistake, email me and
            I&apos;ll sort it out.
          </p>

          <h2>No promises btw</h2>
          <p>
            The site is a side
            project, so it may go down, lose features, or have bugs. I&apos;m going to try my best to keep this up and running.
          </p>

          <h2>Liability</h2>
          <p>
            To the extent allowed by law, the site creator is not responsible
            for any losses, damages, or harm that result from using or relying
            on the site, including downtime, data loss, or content posted by
            other users.
          </p>

          <h2>Contact</h2>
          <p>
            Questions, takedown requests, or concerns: email{" "}
            <a href="mailto:dzkchen@gmail.com">dzkchen@gmail.com</a>.
          </p>

          <p style={{ marginTop: 28 }}>
            See also: <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
