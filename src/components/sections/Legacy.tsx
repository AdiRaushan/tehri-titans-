import { Reveal } from "@/components/Reveal";
import { UPLMark } from "@/components/UPLMark";
import { Timeline } from "@/components/Timeline";
import { SideMountains } from "@/components/SideMountains";
import { MountainDivider } from "@/components/MountainDivider";
import { timeline } from "@/data/timeline";
import { leagueHighlights } from "@/data/franchise";

export function Legacy() {
  return (
    <section
      id="journey"
      className="relative scroll-mt-20 border-y border-navy-700/10 bg-white pt-20 pb-8 sm:pt-28 sm:pb-12 text-navy-950 overflow-hidden"
    >
      {/* Side margin mountain outlines */}
      <SideMountains align="left" className="top-10 bottom-10" />
      <SideMountains align="right" className="top-24 bottom-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        <Reveal className="flex flex-col gap-4 items-start">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-ice-500">
            Franchise &amp; League
          </span>
          <h2 className="max-w-4xl text-4xl font-display uppercase tracking-wide leading-[0.95] sm:text-6xl lg:text-7xl text-navy-950">
            Made in the mountains.
          </h2>
          <p className="max-w-measure text-base leading-relaxed text-navy-800 sm:text-lg font-sans">
            A professional franchise built to compete in the Uttarakhand Premier
            League — carrying Tehri Garhwal onto the state&rsquo;s biggest
            cricketing stage.
          </p>
          <div className="mt-2 inline-flex items-center gap-4 bg-navy-900 border border-navy-700/80 px-6 py-3.5 rounded-2xl shadow-xl w-fit">
            <UPLMark className="h-9 w-auto sm:h-11" />
            <span className="h-8 w-px bg-white/20" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ice-500">Official Tournament</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-ice-200">Uttarakhand Premier League</span>
            </div>
          </div>
        </Reveal>

        {/* UPL highlight cards — styled as premium warrior-inspired sport cards, kept dark for contrast */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {leagueHighlights.map((item, i) => (
            <Reveal
              key={item.label}
              delay={item.label === "Next Season" ? 0.12 : i * 0.06}
              className="rounded-none border border-navy-700 border-l-4 border-l-ice-500 bg-navy-800/80 p-6 shadow-glow-cyan-sm hover:shadow-glow-cyan hover:border-ice-500/50 transition-all duration-300"
            >
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-ice-500">
                {item.label}
              </span>
              <h3 className="mt-2 text-xl font-display uppercase tracking-wide text-ice-200">{item.value}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ice-200/70 font-sans">
                {item.detail}
              </p>
            </Reveal>
          ))}
        </div>

        {/* Franchise milestone timeline */}
        <div className="mt-20">
          <Reveal>
            <h3 className="mb-10 text-center text-3xl font-display uppercase tracking-wide text-navy-950">
              Franchise Milestones
            </h3>
          </Reveal>
          <Timeline items={timeline} theme="light" />
        </div>
      </div>

      {/* Mountain outline line-art section divider */}
      <MountainDivider className="mt-12 sm:mt-16" />
    </section>
  );
}
