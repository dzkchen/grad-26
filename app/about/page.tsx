import type { Metadata } from "next";
import Image from "next/image";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About — Class of 2026",
  description:
    "About the Fraser Grads '26 project and how to contact its creator.",
};

const contacts = [
  {
    href: "mailto:dzkchen@gmail.com",
    icon: "@",
    label: "Email",
    value: "dzkchen@gmail.com",
  },
  {
    href: "https://instagram.com/c.zk.david",
    icon: "IG",
    label: "Instagram",
    value: "@c.zk.david",
  },
  {
    href: "https://www.linkedin.com/in/davidzekaichen/",
    icon: "in",
    label: "LinkedIn",
    value: "davidzekaichen",
  },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.headerEyebrow}>Fraser &apos;26</p>
          <h1 className={styles.headerTitle}>
            About
            <br />
            <span>This Project</span>
          </h1>
        </div>
      </header>

      <section className={`${styles.section} ${styles.reveal}`}>
        <div className={styles.sectionEyebrow}>
          <span className={styles.sectionNumber}>01</span>
          <span className={styles.sectionLabel}>Contributors</span>
          <span className={styles.sectionLine} />
        </div>

        <div className={styles.contributors}>
          <article className={styles.polaroid}>
            <div className={styles.photo}>
              <Image
                src="/about/me.jpg"
                alt="David Chen, creator of Fraser Grads '26"
                fill
                sizes="(max-width: 900px) calc(100vw - 80px), 300px"
                priority
                className={styles.photoImage}
              />
            </div>
            <div className={styles.polaroidMeta}>
              <p className={styles.role}>Developer &amp; Maintainer</p>
              <h2 className={styles.name}>David Chen</h2>
              <p className={styles.quote}>
                &quot;This took me way too long...&quot;
              </p>
            </div>
          </article>

          <div className={styles.premisePanel}>
            <p className={styles.premiseEyebrow}>The premise</p>
            <h2 className={styles.premiseHeadline}>
              A way for us to actually <span>stay connected!</span>
            </h2>
            <div className={styles.premiseCopy}>
              <p>
                Fraser Grads &apos;26 is an unofficial, student-made project
                for the Class of &apos;26 where stats, the directory, and other
                class pieces sit in one place we can come back to over time.
              </p>
              <p>
                The goal is to help us look back on high school after
                graduation and stay connected with one another. It can also
                give younger grades a better look at senior life and a way to
                reach out for university application help.
              </p>
              <p>
                Good luck on your future to all. <strong>Go Jags!</strong>
              </p>
              <p>
                Special thanks to Arjita and Inesh for helping make the survey
                questions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.revealLate}`}>
        <div className={styles.sectionEyebrow}>
          <span className={styles.sectionNumber}>02</span>
          <span className={styles.sectionLabel}>Get in touch</span>
          <span className={styles.sectionLine} />
        </div>

        <div className={styles.contact}>
          <div className={styles.contactHeader}>
            <h2 className={styles.contactTitle}>
              Contact<span>.</span>
            </h2>
            <p className={styles.contactSub}>
              Feel free to contact me at any of the options below :)
            </p>
          </div>

          <div className={styles.contactMethods}>
            {contacts.map((contact) => (
              <a
                key={contact.href}
                href={contact.href}
                target={contact.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  contact.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className={styles.contactMethod}
              >
                <span className={styles.contactIcon}>{contact.icon}</span>
                <span className={styles.contactBody}>
                  <span className={styles.contactLabel}>{contact.label}</span>
                  <span className={styles.contactValue}>{contact.value}</span>
                </span>
                <span className={styles.contactArrow} aria-hidden>
                  →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
