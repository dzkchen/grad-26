import Image from "next/image";

export function HeroBackground() {
  return (
    <div className="jf-hero-bg" aria-hidden>
      <Image
        src="/hero-bg.png"
        alt=""
        fill
        sizes="100vw"
        preload
        className="jf-hero-bg-image"
      />
    </div>
  );
}
