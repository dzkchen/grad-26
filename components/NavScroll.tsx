"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function NavScroll({
  brand,
  menu,
}: {
  brand: React.ReactNode;
  menu: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const navCls = [
    "jf-nav",
    isHome ? "jf-nav--home" : "",
    isHome && scrolled ? "jf-nav--scrolled" : "",
    open ? "jf-nav--open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={navCls}>
      {brand}
      <button
        type="button"
        className="jf-nav-burger"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="jf-nav-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`jf-nav-burger-icon ${open ? "is-open" : ""}`}>
          <span />
          <span />
          <span />
        </span>
      </button>
      <div
        id="jf-nav-menu"
        className={`jf-nav-right ${open ? "jf-nav-right--open" : ""}`}
        onClick={() => setOpen(false)}
      >
        {menu}
      </div>
    </nav>
  );
}
