import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Legacy } from "@/components/sections/Legacy";
import { Gallery } from "@/components/sections/Gallery";
import { Collaboration } from "@/components/sections/Collaboration";
import { Camp } from "@/components/sections/Camp";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Legacy />
      <Gallery />
      <Collaboration />
      <Camp />
    </>
  );
}
