import type { Variants } from "framer-motion";

// Reduced-motion aware animation helpers. When the user prefers reduced
// motion, every variant degrades to an opacity-only fade with no transform
// and no delay — see `useReducedMotionVariants` below and the `Reveal`
// wrapper in components/motion.

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

// Opacity-only fallbacks used when prefers-reduced-motion is set.
export const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

export const staggerReduced: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

/** Pick the motion or reduced variant for a given animation. */
export function resolveVariants(
  reduced: boolean,
  motion: Variants,
): Variants {
  return reduced ? fadeOnly : motion;
}

export function resolveContainer(reduced: boolean): Variants {
  return reduced ? staggerReduced : staggerContainer;
}

// Shared viewport config so reveals fire consistently across sections.
export const viewportOnce = { once: true, amount: 0.25 } as const;
