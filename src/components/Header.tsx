"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { UPLMark } from "./UPLMark";
import { CTAButton } from "./CTAButton";
import { clsx } from "@/lib/clsx";
import { navLinks, primaryCta } from "@/data/nav";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDarkNav = scrolled || pathname === "/admin";

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        isDarkNav
          ? "border-b border-navy-700/50 bg-navy-900/95 backdrop-blur-md shadow-glow-cyan-sm"
          : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Centered on mobile, aligned left on desktop */}
        <div className="w-full flex justify-center lg:w-auto lg:justify-start items-center gap-2.5 sm:gap-3">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="Tehri Titans home"
          >
            <Logo className="h-12 w-12 sm:h-14 sm:w-14 transition-transform duration-300 group-hover:scale-105" />
          </Link>
          {/* UPL co-brand — wrapped in frosted glass */}
          <div className="flex items-center gap-2.5 sm:gap-3 bg-white/10 border border-white/15 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg backdrop-blur-sm shadow-glow-cyan-sm">
            <span aria-hidden className="h-6 sm:h-8 w-px bg-white/20" />
            <UPLMark className="h-11 sm:h-14 w-auto" />
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold tracking-wide uppercase text-ice-200/80 transition-colors duration-200 hover:text-ice-500 relative py-2 group"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-ice-500 transition-all duration-200 group-hover:w-full" />
            </Link>
          ))}
        </div>

        {/* Desktop Right CTA */}
        <div className="hidden lg:flex items-center gap-2">
          <CTAButton href={primaryCta.href}>
            {primaryCta.label}
          </CTAButton>
        </div>
      </nav>
    </header>
  );
}
