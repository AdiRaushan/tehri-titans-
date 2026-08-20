import Link from "next/link";
import {
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Mail,
  MapPin,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "./Logo";
import { UPLMark } from "./UPLMark";
import { navLinks, socialLinks, contactEmails } from "@/data/nav";
import { franchise } from "@/data/franchise";

const iconMap: Record<string, LucideIcon> = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  facebook: Facebook,
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-navy-700 bg-navy-950 text-ice-200 relative overflow-hidden font-sans">
      {/* Background mountain line-art graphic watermark */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-10">
        <svg
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
          className="h-[25vh] w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 220 L220 90 L400 150 L640 60 L880 150 L1100 50 L1320 140 L1440 80 L1440 220 Z"
            fill="none"
            stroke="#0ACFFB"
            strokeWidth="3"
          />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 relative z-10">
        {/* Main Footer Grid */}
        <div className="grid gap-12 lg:grid-cols-12 border-b border-navy-800 pb-12">
          {/* Brand & Prominent Logos (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Logos Header Row */}
            <div className="flex items-center gap-6 flex-wrap">
              <Link href="/" className="group flex items-center gap-3">
                <Logo className="h-20 w-20 sm:h-24 sm:w-24 transition-transform duration-300 group-hover:scale-105" />
              </Link>
              <div className="h-16 w-px bg-navy-700/60 hidden sm:block" />
              <div className="bg-white/10 border border-white/20 px-4 py-2.5 rounded-xl backdrop-blur-md shadow-glow-cyan-sm">
                <UPLMark className="h-12 w-auto sm:h-16" />
              </div>
            </div>

            <div>
              <p className="text-xs leading-relaxed text-ice-200/70 font-sans max-w-md">
                Official professional T20 franchise representing Tehri Garhwal in the Uttarakhand Premier League (UPL). Partnered with Ayush Cricket Academy to build grassroots pathways for future champions.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-ice-400">
              <MapPin className="h-4 w-4 text-ice-500" />
              <span>{franchise.location}</span>
            </div>
          </div>

          {/* Links Grid (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* Quick Navigation */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-[0.18em] text-ice-500 mb-4">
                Navigation
              </h5>
              <ul className="flex flex-col gap-3 font-sans text-xs">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-ice-200/70 hover:text-white font-medium transition-colors hover:translate-x-1 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trials & Pathway */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-[0.18em] text-ice-500 mb-4">
                Trials &amp; Pathway
              </h5>
              <ul className="flex flex-col gap-3 font-sans text-xs text-ice-200/70 font-medium">
                <li>
                  <Link href="/#trials" className="hover:text-white transition-colors">
                    Open Trials Registration
                  </Link>
                </li>
                <li>
                  <Link href="/#collaboration" className="hover:text-white transition-colors">
                    Ayush Cricket Academy
                  </Link>
                </li>
                <li>
                  <Link href="/#gallery" className="hover:text-white transition-colors">
                    Photo Gallery
                  </Link>
                </li>
              </ul>
            </div>

            {/* Portal & Admin */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-[0.18em] text-ice-500 mb-4">
                Portal &amp; Legal
              </h5>
              <ul className="flex flex-col gap-3 font-sans text-xs text-ice-200/70 font-medium">
                <li>
                  <Link href="/admin" className="hover:text-ice-400 transition-colors flex items-center gap-1.5 font-bold text-white">
                    <ShieldCheck className="h-3.5 w-3.5 text-ice-500" />
                    Admin Dashboard
                  </Link>
                </li>
                <li>
                  <a href={`mailto:${contactEmails.general}`} className="hover:text-white transition-colors">
                    General: {contactEmails.general}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${contactEmails.marketing}`} className="hover:text-white transition-colors">
                    Marketing: {contactEmails.marketing}
                  </a>
                </li>
                <li className="text-ice-200/50">
                  Cashfree Secured Gateway
                </li>
                <li className="text-ice-200/50">
                  UPL Official Franchise
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Social Links */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans">
          <div className="flex items-center gap-3">
            {socialLinks.map((s) => {
              const Icon = iconMap[s.icon] || Mail;
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="rounded-xl border border-navy-700 bg-navy-900 p-2.5 text-ice-200/70 transition-all duration-200 hover:border-ice-500 hover:text-white hover:shadow-glow-cyan-sm"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>

          <p className="text-ice-200/50 text-center sm:text-right">
            © {year} Tehri Titans T20 Franchise. All rights reserved. Built for Uttarakhand Premier League.
          </p>
        </div>
      </div>
    </footer>
  );
}
