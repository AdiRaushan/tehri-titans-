import { clsx } from "@/lib/clsx";

/**
 * Sober surface card for the light theme — white fill, hairline navy border,
 * a soft shadow, and a quiet lift on hover. Optional accent border for the
 * icon-player motif.
 */
export function GlassCard({
  children,
  className,
  accent = "ice",
  theme = "dark",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  accent?: "ice" | "lime" | "none";
  theme?: "light" | "dark";
  as?: "div" | "article" | "li";
}) {
  return (
    <Tag
      className={clsx(
        "transition-all duration-300 relative overflow-hidden border",
        // Sharp warrior-inspired edges rather than generic rounded corners
        "rounded-none",
        theme === "dark"
          ? "bg-navy-800/90 border-navy-700 text-ice-200 shadow-glow-cyan-sm hover:shadow-glow-cyan hover:border-ice-500/50"
          : "bg-white border-navy-700/10 text-navy-950 shadow-sm hover:shadow-md hover:border-ice-500/40",
        accent !== "none" && "border-l-4 border-l-ice-500",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
