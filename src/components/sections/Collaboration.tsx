import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { GlassCard } from "@/components/GlassCard";
import { CTAButton } from "@/components/CTAButton";
import { Logo } from "@/components/Logo";
import { Check } from "lucide-react";
import { SideMountains } from "@/components/SideMountains";
import { MountainDivider } from "@/components/MountainDivider";
import { collaboration } from "@/data/camp";

export function Collaboration() {
  const { academyName, academyLogo, partnerLabel, lede, body, points } =
    collaboration;

  // Initials badge fallback until a logo file is supplied.
  const initials = academyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <section
      id="academy"
      className="relative scroll-mt-20 border-y border-navy-700/10 bg-white pt-20 pb-8 sm:pt-28 sm:pb-12 text-navy-950 overflow-hidden"
    >
      {/* Side margin mountain outlines */}
      <SideMountains align="left" className="top-10 bottom-10" />
      <SideMountains align="right" className="top-24 bottom-10" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Collaboration"
          title="Titans × Ayush Cricket Academy"
          lede={lede}
          align="center"
          theme="light"
        />

        {/* Co-brand lockup — Clean, upright, high-contrast frame */}
        <Reveal className="mt-12 flex items-center justify-center gap-6 sm:gap-10 bg-navy-900 py-6 px-8 rounded-2xl border border-navy-700 max-w-lg mx-auto shadow-xl">
          <Logo className="h-24 w-24 sm:h-28 sm:w-28 transition-transform duration-300 hover:scale-105" />
          <span
            aria-hidden
            className="font-display text-3xl text-ice-500/80 sm:text-4xl"
          >
            ×
          </span>
          <a
            href={collaboration.website}
            target="_blank"
            rel="noopener noreferrer"
            title={`Visit ${academyName}`}
            className="inline-block transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ice-500/50 rounded-xl"
          >
            {academyLogo ? (
              <Image
                src={academyLogo}
                alt={`${academyName} logo`}
                width={220}
                height={220}
                className="h-24 w-24 object-contain sm:h-28 sm:w-28"
              />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-xl border border-ice-500/30 bg-navy-800 font-display text-2xl tracking-tightest text-ice-200 shadow-sm sm:h-28 sm:w-28 sm:text-3xl">
                {initials}
              </span>
            )}
          </a>
        </Reveal>

        <Reveal className="mt-4 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-ice-500">
            {partnerLabel}
          </span>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            {body.map((para, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <p className="max-w-measure text-base leading-relaxed text-navy-800 sm:text-lg font-sans">
                  {para}
                </p>
              </Reveal>
            ))}
            <Reveal delay={0.1}>
              <CTAButton href="/#trials">Register for Trials</CTAButton>
            </Reveal>
          </div>

          <Reveal className="lg:pt-2">
            <GlassCard className="p-6 sm:p-8" theme="light">
              <h3 className="text-xl font-display uppercase tracking-wide text-navy-950">What the partnership brings</h3>
              <ul className="mt-5 flex flex-col gap-4">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-none bg-ice-500/15 text-ice-500 shadow-glow-cyan-sm">
                      <Check className="h-4 w-4" />
                    </span>
                    <span className="text-sm leading-relaxed text-navy-800 sm:text-base font-sans font-medium">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </Reveal>
        </div>
      </div>

      {/* Mountain outline line-art section divider */}
      <MountainDivider className="mt-12 sm:mt-16" />
    </section>
  );
}
