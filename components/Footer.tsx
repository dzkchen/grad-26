import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="jf-footer">
      <div className="jf-footer-logo">
        <Image src="/logo.png" alt="Fraser '26" width={32} height={32} />
        <span>Fraser &apos;26</span>
      </div>
      <nav className="jf-footer-links" aria-label="Site policies">
        <Link href="/about">About</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
      <p className="jf-footer-copy">
        Unofficial Project (not affiliated with John Fraser SS or PDSB)
      </p>
    </footer>
  );
}
