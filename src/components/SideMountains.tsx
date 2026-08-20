import { clsx } from "@/lib/clsx";

/**
 * Vertical mountain-outline graphics for side margins.
 * Placed absolutely on the left or right margins of light-themed sections.
 * Displays only on large screens (xl and above) using a subtle, low-opacity Midnight Navy line-art.
 */
export function SideMountains({
  align = "left",
  className,
}: {
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={clsx(
        "hidden xl:block absolute top-10 bottom-10 pointer-events-none w-24 opacity-[0.08] select-none",
        align === "left" ? "left-4 sm:left-6" : "right-4 sm:right-6",
        className
      )}
    >
      <svg
        viewBox="0 0 100 1000"
        preserveAspectRatio="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {align === "left" ? (
          // Jagged mountain profile on the left margin
          <path
            d="M 10 0 
               L 30 80 
               L 15 150 
               L 45 230 
               L 20 310 
               L 55 400 
               L 25 490 
               L 40 580 
               L 15 670 
               L 35 760 
               L 20 850 
               L 45 930 
               L 10 1000"
            fill="none"
            stroke="#01072F"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          // Jagged mountain profile on the right margin
          <path
            d="M 90 0 
               L 70 80 
               L 85 150 
               L 55 230 
               L 80 310 
               L 45 400 
               L 75 490 
               L 60 580 
               L 85 670 
               L 65 760 
               L 80 850 
               L 55 930 
               L 90 1000"
            fill="none"
            stroke="#01072F"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
}
