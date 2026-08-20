"use client";

import { motion, useReducedMotion } from "framer-motion";
import { clsx } from "@/lib/clsx";
import { viewportOnce } from "@/lib/motion";
import type { Milestone } from "@/data/timeline";

export function Timeline({ items, theme = "light" }: { items: Milestone[]; theme?: "light" | "dark" }) {
  const reduced = useReducedMotion();

  return (
    <ol className="relative mx-auto max-w-2xl">
      {/* Spine - Glowing Electric Cyan path */}
      <span
        aria-hidden
        className={clsx(
          "absolute left-[15px] top-2 h-[calc(100%-1rem)] w-px sm:left-[19px]",
          theme === "dark" ? "bg-ice-500/20" : "bg-ice-500/30"
        )}
      />
      {items.map((item, i) => (
        <motion.li
          key={item.marker + item.title}
          initial={{ opacity: 0, x: reduced ? 0 : -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, delay: reduced ? 0 : i * 0.08 }}
          className="relative flex gap-5 pb-10 last:pb-0 sm:gap-6"
        >
          <span
            className={clsx(
              "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border sm:h-10 sm:w-10",
              theme === "dark"
                ? "border-ice-500 text-ice-500 bg-navy-950 shadow-glow-cyan-sm"
                : "border-ice-500 text-ice-500 bg-white shadow-sm"
            )}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
          </span>
          <div className="pt-0.5">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-ice-500">
              {item.marker}
            </span>
            <h3
              className={clsx(
                "mt-1 text-2xl font-display uppercase tracking-tightest leading-tight",
                theme === "dark" ? "text-ice-200" : "text-navy-950"
              )}
            >
              {item.title}
            </h3>
            <p
              className={clsx(
                "mt-2 max-w-measure text-sm leading-relaxed font-sans",
                theme === "dark" ? "text-ice-200/70" : "text-navy-800"
              )}
            >
              {item.description}
            </p>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
