import Link from "next/link";

export default function NotFound() {
  return (
    <div className="jf-home">
      <section className="jf-hero">
        <div className="jf-hero-bg" aria-hidden />
        <div className="jf-hero-content">
          <div className="jf-hero-tag">John Fraser Secondary School</div>
          <div className="jf-hero-big">
            4<span className="jf-yr">04</span>
          </div>
          <p className="jf-hero-tagline">This page doesn&apos;t exist.</p>
          <div className="jf-hero-actions">
            <Link href="/" className="jf-btn-white">
              Go Home →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
