import { clsx } from "@/lib/clsx";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  theme = "dark",
  className,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
  theme?: "light" | "dark";
  className?: string;
}) {
  return (
    <Reveal
      className={clsx(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && (
        <div className={clsx("flex items-center gap-2", align === "center" && "justify-center")}>
          <span className="h-3.5 w-1 bg-ice-500 skew-x-[-15deg] inline-block" />
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-ice-500">
            {eyebrow}
          </span>
        </div>
      )}
      <h2
        className={clsx(
          "text-4xl font-display leading-[0.95] sm:text-5xl lg:text-6xl uppercase tracking-wide",
          theme === "dark" ? "text-ice-200" : "text-navy-950",
        )}
      >
        {title}
      </h2>

      {/* Titan Strikes Divider */}
      <div className={clsx("flex items-center gap-1.5 my-1", align === "center" && "justify-center")}>
        <div className="h-1 w-16 bg-ice-500 skew-x-[-20deg]" />
        <div className={clsx("h-1 w-2.5 skew-x-[-20deg]", theme === "dark" ? "bg-ice-200" : "bg-navy-950")} />
      </div>

      {lede && (
        <p
          className={clsx(
            "max-w-measure text-base leading-relaxed sm:text-lg font-sans",
            theme === "dark" ? "text-ice-200/70" : "text-navy-700",
            align === "center" && "mx-auto",
          )}
        >
          {lede}
        </p>
      )}
    </Reveal>
  );
}
