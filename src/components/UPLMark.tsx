import Image from "next/image";
import { clsx } from "@/lib/clsx";

/**
 * Official Uttarakhand Premier League logo. The artwork already includes the
 * wordmark and sits on white, so it renders directly on the site's white
 * surfaces — the co-brand mark that sits level with the Titans crest.
 * Size is controlled by the caller via `className` (e.g. "h-14 w-auto").
 */
export function UPLMark({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/upl-logo.png"
      alt="Uttarakhand Premier League"
      width={447}
      height={447}
      priority={priority}
      className={clsx("object-contain", className)}
    />
  );
}
