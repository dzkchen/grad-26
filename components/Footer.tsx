import Image from "next/image";

export function Footer() {
  return (
    <footer className="jf-footer">
      <div className="jf-footer-logo">
        <Image src="/logo.png" alt="Fraser '26" width={32} height={32} />
        <span>Fraser &apos;26</span>
      </div>
    </footer>
  );
}
