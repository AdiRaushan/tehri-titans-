"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Logo } from "@/components/Logo";
import { UPLMark } from "@/components/UPLMark";
import { CTAButton } from "@/components/CTAButton";
import { franchise } from "@/data/franchise";

export function Hero() {
  const reduced = useReducedMotion();
  const rise = reduced ? {} : { y: 16 };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-28 pb-16 text-center bg-navy-900">
      {/* Stadium spotlight glow + subtle tech mesh background */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-ice-500/20 via-navy-900/60 to-navy-950 opacity-80" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#0acffb0a_1px,transparent_1px),linear-gradient(to_bottom,#0acffb0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Layered mountain wireframe line-art across the entire hero backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 w-full overflow-hidden opacity-45">
        <svg
          viewBox="0 0 1440 280"
          preserveAspectRatio="none"
          className="h-[35vh] w-full block"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Distant Mountain Range - Fine Dashed Cyan Outline */}
          <path
            d="M0 280 L40 180 L90 220 L160 140 L230 190 L320 90 L410 160 L500 80 L590 150 L680 60 L770 140 L860 75 L950 160 L1040 90 L1130 170 L1220 100 L1310 180 L1400 120 L1440 150 L1440 280 Z"
            fill="none"
            stroke="#0ACFFB"
            strokeWidth="1.25"
            strokeDasharray="4 4"
            opacity="0.5"
          />
          {/* Mid Mountain Range - Sharp Cyan Line-Art */}
          <path
            d="M0 280 L70 200 L140 230 L220 150 L310 200 L400 110 L490 175 L580 100 L670 170 L760 85 L850 160 L940 105 L1030 180 L1120 120 L1210 190 L1300 130 L1390 180 L1440 140 L1440 280 Z"
            fill="none"
            stroke="#0ACFFB"
            strokeWidth="1.75"
            strokeDasharray="6 3"
            opacity="0.7"
          />
          {/* Foreground Main Himalayan Peaks - Bold Electric Cyan Outline */}
          <path
            d="M0 280 L100 210 L190 245 L290 160 L380 210 L480 120 L570 190 L660 110 L750 180 L840 130 L930 200 L1020 145 L1110 210 L1200 150 L1290 220 L1380 165 L1440 190 L1440 280 Z"
            fill="none"
            stroke="#0ACFFB"
            strokeWidth="2.5"
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-7">
        {/* Franchise context badge — confident, upright, un-skewed */}
        <motion.div
          initial={{ opacity: 0, ...rise }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2.5 rounded-full border border-ice-500/40 bg-navy-800/90 px-5 py-2 text-xs font-extrabold uppercase tracking-[0.25em] text-ice-500 shadow-glow-cyan-sm"
        >
          <span className="h-2 w-2 rounded-full bg-ice-500 animate-pulse" />
          Official UPL Franchise
        </motion.div>

        {/* Co-brand lockup — Clean, upright, un-skewed glassmorphism */}
        <motion.div
          initial={{ opacity: 0, ...rise }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.06 }}
          className="flex items-center gap-6 sm:gap-8 rounded-xl bg-white/10 p-5 sm:p-6 border border-white/20 backdrop-blur-md shadow-glow-cyan-sm"
        >
          <Logo className="h-20 w-20 sm:h-28 sm:w-28 transition-transform duration-300 hover:scale-105" priority />
          <span aria-hidden className="h-16 w-px bg-white/30 sm:h-24" />
          <UPLMark className="h-20 w-auto sm:h-28 transition-transform duration-300 hover:scale-105" priority />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, ...rise }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold uppercase tracking-tight text-white drop-shadow-md"
        >
          Tehri Titans
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-xl text-base leading-relaxed text-ice-200/80 sm:text-lg font-sans"
        >
          {franchise.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-ice-500 drop-shadow-[0_0_8px_rgba(10,207,251,0.3)]"
        >
          <MapPin className="h-3.5 w-3.5" />
          {franchise.location}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, ...rise }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.36 }}
          className="mt-1 flex flex-col gap-4 sm:flex-row"
        >
          <CTAButton href="/#trials">Register for Trials</CTAButton>
          <CTAButton href="/#academy" variant="ghost">
            Our Academy
          </CTAButton>
        </motion.div>
      </div>
    </section>
  );
}
