import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { GlassCard } from "@/components/GlassCard";
import { SideMountains } from "@/components/SideMountains";
import { MountainDivider } from "@/components/MountainDivider";
import { aboutCopy, quickFacts } from "@/data/franchise";

export function About() {
  return (
    <section id="about" className="relative scroll-mt-20 pt-20 pb-8 sm:pt-28 sm:pb-12 bg-white text-navy-950 overflow-hidden">
      {/* Side margin mountain outlines */}
      <SideMountains align="left" className="top-10 bottom-10" />
      <SideMountains align="right" className="top-24 bottom-10" />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="The Franchise"
            title="Built in the mountains. Made to compete."
            theme="light"
          />
          {aboutCopy.map((para, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <p className="max-w-measure text-base leading-relaxed text-navy-800 sm:text-lg font-sans">
                {para}
              </p>
            </Reveal>
          ))}
        </div>

        <Reveal className="lg:pt-4">
          <GlassCard className="overflow-hidden" theme="light">
            <div className="border-b border-navy-700/10 px-6 py-4">
              <h3 className="text-xl font-display uppercase tracking-wide text-navy-950">Quick Facts</h3>
            </div>
            <dl className="divide-y divide-navy-700/10 font-sans">
              {quickFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="grid grid-cols-1 gap-1 px-6 py-4 sm:grid-cols-3 sm:gap-4"
                >
                  <dt className="text-xs font-bold uppercase tracking-[0.15em] text-ice-500">
                    {fact.label}
                  </dt>
                  <dd className="text-sm text-navy-900 sm:col-span-2 font-medium">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </GlassCard>
        </Reveal>
      </div>

      {/* Mountain outline line-art section divider */}
      <MountainDivider className="mt-12 sm:mt-16" />
    </section>
  );
}
