import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HeroBackground } from "@/components/HeroBackground";

export const metadata: Metadata = {
  title: "Class of 2026 — John Fraser SS",
  description:
    "The John Fraser SS Class of 2026 grad site — browse the directory, see class stats, and take the senior survey.",
};

export default function Home() {
  return (
    <div className="jf-home">
      <section className="jf-hero">
        <HeroBackground />
        <div className="jf-hero-content">
          <div className="jf-hero-tag">
            <Image src="/logo.png" alt="" width={18} height={18} />
            John Fraser Secondary School
          </div>
          <div className="jf-hero-big">
            CLASS
            <br />
            OF <span className="jf-yr">&apos;26</span>
          </div>
          <div className="jf-hero-actions">
            <Link href="/directory" className="jf-btn-white">
              Explore the Class →
            </Link>
            <Link href="/survey" className="jf-btn-ghost">
              Take the Survey
            </Link>
          </div>
        </div>
      </section>

      <div className="jf-wave" aria-hidden>
        <svg
          viewBox="0 0 1440 100"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 L1440,0 L1440,55 C1280,95 1100,20 920,65 C740,110 560,18 380,68 C280,92 140,62 0,82 Z"
            fill="#0D1B4B"
          />
        </svg>
      </div>

      <section className="jf-scattered">
        <p className="jf-scattered-label">What&apos;s inside</p>
        <h2 className="jf-scattered-heading">

        </h2>

        <div className="jf-cards">
          <Link href="/directory" className="jf-card jf-card-directory">
            <div className="jf-dir-header">
              <div className="jf-dir-eyebrow">Class Directory</div>
              <div className="jf-dir-headline">
                Stay
                <br />
                <span>Connected</span>
              </div>
              <div className="jf-dir-sub">
                Class of &apos;26; photos, quotes, where we&apos;re headed.
              </div>
            </div>
            <div className="jf-dir-body">
              <div className="jf-polaroids">
                <div
                  className="jf-pol"
                  style={{ ["--pr" as string]: "-3deg" } as React.CSSProperties}
                >
                  <div className="jf-pol-img">😊</div>
                </div>
                <div
                  className="jf-pol"
                  style={
                    {
                      ["--pr" as string]: "2deg",
                      marginBottom: 16,
                    } as React.CSSProperties
                  }
                >
                  <div className="jf-pol-img">🎓</div>
                </div>
                <div
                  className="jf-pol"
                  style={
                    { ["--pr" as string]: "-1.5deg" } as React.CSSProperties
                  }
                >
                  <div className="jf-pol-img">✨</div>
                </div>
                <div
                  className="jf-pol"
                  style={
                    {
                      ["--pr" as string]: "2.5deg",
                      marginBottom: 8,
                    } as React.CSSProperties
                  }
                >
                  <div className="jf-pol-img">🌟</div>
                </div>
              </div>
              <div className="jf-dir-cta">
                <span>Browse →</span>
                <div className="jf-dir-cta-arrow">→</div>
              </div>
            </div>
          </Link>

          <div className="jf-card jf-card-rewind" aria-disabled>
            <div className="jf-rw-inner">
              <div className="jf-rw-top">
                <span className="jf-rw-wip">
                  <span className="jf-rw-wip-dot" />
                  In Progress
                </span>
              </div>
              <div className="jf-rw-headline">
                RE<span>WIND</span>
              </div>
              <div className="jf-rw-timeline">
                <div className="jf-rw-entry">
                  <span className="jf-rw-year">2022</span>
                  <span className="jf-rw-label">
                    To you, 4 years from now
                  </span>
                  <div className="jf-rw-pip" />
                </div>
                <div className="jf-rw-entry">
                  <span className="jf-rw-year">2023</span>
                  <span className="jf-rw-label" />
                  <div className="jf-rw-pip" />
                </div>
                <div className="jf-rw-entry">
                  <span className="jf-rw-year">2024</span>
                  <span className="jf-rw-label" />
                  <div className="jf-rw-pip" />
                </div>
                <div className="jf-rw-entry">
                  <span className="jf-rw-year">2025</span>
                  <span className="jf-rw-label">From you, 4 years ago</span>
                  <div className="jf-rw-pip" />
                </div>
              </div>
              <div className="jf-rw-cta">See the scrapbook →</div>
            </div>
          </div>

          <div className="jf-card jf-card-survey">
            <Link href="/survey" className="jf-sv-left">
              <div>
                <div className="jf-sv-eyebrow">Senior Survey</div>
                <div className="jf-sv-headline">
                  Add
                  <br />
                  Your
                  <br />
                  Voice
                </div>
                <div className="jf-sv-fields">
                  <div className="jf-sv-field" />
                  <div className="jf-sv-field" />
                  <div className="jf-sv-field" />
                </div>
              </div>
              <div className="jf-sv-btn">Start → 5 mins</div>
            </Link>
            <Link href="/stats" className="jf-sv-right">
              <div>
                <div className="jf-st-eyebrow">Class Stats</div>
                <div className="jf-st-headline">
                  By The
                  <br />
                  Numbers
                </div>
                <div className="jf-st-bars">
                  <div className="jf-st-bar-row">
                    <div className="jf-st-bar-lbl">University</div>
                    <div className="jf-st-bar-track">
                      <div
                        className="jf-st-bar-fill"
                        style={{ width: "72%" }}
                      />
                    </div>
                  </div>
                  <div className="jf-st-bar-row">
                    <div className="jf-st-bar-lbl">Sleep avg</div>
                    <div className="jf-st-bar-track">
                      <div
                        className="jf-st-bar-fill"
                        style={{ width: "52%", background: "#1E6FD9" }}
                      />
                    </div>
                  </div>
                  <div className="jf-st-bar-row">
                    <div className="jf-st-bar-lbl">Stress</div>
                    <div className="jf-st-bar-track">
                      <div
                        className="jf-st-bar-fill"
                        style={{ width: "83%", background: "#A8C8F0" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="jf-st-cta">View all data →</div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
