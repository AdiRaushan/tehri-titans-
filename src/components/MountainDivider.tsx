import { clsx } from "@/lib/clsx";

/**
 * Full-width Mountain Outline Line-Art Section Divider
 * Continuous Himalayan mountain range wireframe (dashed & solid cyan line-art)
 * matching the Tehri Titans brand identity divider specification.
 */
export function MountainDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx(
        "w-full overflow-hidden leading-none pointer-events-none opacity-85 my-4 sm:my-6",
        className
      )}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="w-full h-12 sm:h-16 md:h-20 block"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Back Mountain Range Outline — Dashed Line-Art */}
        <path
          d="M0 110 L60 60 L130 90 L210 30 L290 75 L380 20 L470 65 L560 15 L650 50 L740 25 L830 70 L920 20 L1010 60 L1100 15 L1190 55 L1280 30 L1360 70 L1440 40"
          fill="none"
          stroke="#0ACFFB"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.6"
        />

        {/* Front Mountain Range Outline — Solid Electric Cyan Line-Art */}
        <path
          d="M0 115 L90 75 L180 95 L270 50 L360 80 L450 35 L540 70 L630 40 L720 75 L810 45 L900 80 L990 35 L1080 65 L1170 30 L1260 60 L1350 45 L1440 70"
          fill="none"
          stroke="#0ACFFB"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
