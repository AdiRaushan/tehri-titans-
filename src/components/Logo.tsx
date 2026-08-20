import Image from "next/image";
import { clsx } from "@/lib/clsx";

/**
 * Official Tehri Titans crest. Transparent PNG, so it renders cleanly on any
 * background (white or coloured) with no plate. Replace the file in
 * /public/tehri-titans-logo.png to update the mark site-wide.
 */
export function Logo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/tehri-titans-logo.png"
      alt="Tehri Titans crest"
      width={1212}
      height={1297}
      priority={priority}
      className={clsx("object-contain", className)}
    />
  );
}
