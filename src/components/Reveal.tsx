"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { fadeUp, fadeOnly, viewportOnce } from "@/lib/motion";

/**
 * Scroll-reveal wrapper. Uses fadeUp by default and degrades to an
 * opacity-only fade when the user prefers reduced motion.
 */
export function Reveal({
  children,
  variants,
  className,
  as = "div",
  delay,
}: {
  children: React.ReactNode;
  variants?: Variants;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const resolved = reduced ? fadeOnly : variants ?? fadeUp;
  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      variants={resolved}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </MotionTag>
  );
}
