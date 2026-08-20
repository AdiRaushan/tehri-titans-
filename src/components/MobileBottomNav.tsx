"use client";

import Link from "next/link";
import { Home, Shield, Trophy, GraduationCap, Image as ImageIcon } from "lucide-react";

export function MobileBottomNav() {
  const items = [
    { label: "Home", href: "/#top", icon: Home },
    { label: "Franchise", href: "/#about", icon: Shield },
    { label: "Trials", href: "/#trials", icon: Trophy, isPrimary: true },
    { label: "Academy", href: "/#academy", icon: GraduationCap },
    { label: "Gallery", href: "/#gallery", icon: ImageIcon },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-navy-950/95 backdrop-blur-xl border-t border-navy-700/80 shadow-2xl pb-safe">
      <nav className="flex items-center justify-around px-2 py-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="-mt-5 flex flex-col items-center justify-center gap-1 group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ice-500 text-navy-950 shadow-glow-cyan transition-transform group-active:scale-95 border-2 border-navy-950">
                  <Icon className="h-6 w-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-ice-400">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 px-3 py-1 text-ice-200/70 hover:text-ice-400 active:text-ice-400 transition-colors group"
            >
              <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-semibold tracking-tight text-ice-200/80 group-hover:text-ice-400">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
