import Link from "next/link";
import { clsx } from "@/lib/clsx";

type Variant = "primary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 px-7 py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 skew-x-[-12deg] focus-visible:ring-2 focus-visible:ring-ice-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  // Electric Cyan background with Midnight Navy text — bold and warrior-like
  primary: "bg-ice-500 text-navy-950 hover:bg-ice-400 shadow-glow-cyan-sm hover:shadow-glow-cyan",
  // Electric Cyan outline, fills with Cyan on hover
  ghost:
    "border border-ice-500 text-ice-500 bg-transparent hover:bg-ice-500 hover:text-navy-950 hover:shadow-glow-cyan-sm",
};

export function CTAButton({
  href,
  children,
  variant = "primary",
  className,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(base, variants[variant], className)}
    >
      <span className="skew-x-[12deg] inline-flex items-center gap-2">
        {children}
      </span>
    </Link>
  );
}
