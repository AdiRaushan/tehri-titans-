"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { SideMountains } from "@/components/SideMountains";
import { MountainDivider } from "@/components/MountainDivider";

export interface GalleryItem {
  id: string;
  src: string;
  span: string; // Tailwind grid span
}

export const galleryItems: GalleryItem[] = [
  {
    id: "img-1",
    src: "/gallery/1.png",
    span: "md:col-span-2 lg:col-span-2 md:row-span-2",
  },
  {
    id: "img-2",
    src: "/gallery/2.png",
    span: "md:col-span-1 lg:col-span-1",
  },
  {
    id: "img-3",
    src: "/gallery/3.png",
    span: "md:col-span-1 lg:col-span-1",
  },
  {
    id: "img-4",
    src: "/gallery/4.jpeg",
    span: "md:col-span-1 lg:col-span-1",
  },
  {
    id: "img-5",
    src: "/gallery/5.jpeg",
    span: "md:col-span-1 lg:col-span-1",
  },
];

export function Gallery() {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  return (
    <section
      id="gallery"
      className="relative scroll-mt-20 border-y border-navy-700/10 bg-white pt-20 pb-8 sm:pt-28 sm:pb-12 text-navy-950 overflow-hidden"
    >
      {/* Side margin mountain outlines */}
      <SideMountains align="left" className="top-10 bottom-10" />
      <SideMountains align="right" className="top-24 bottom-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        <SectionHeading
          eyebrow="Franchise Highlights · Photo Gallery"
          title="Titans Gallery"
          lede="Moments from the Uttarakhand Premier League."
          align="center"
          theme="light"
        />

        {/* Dynamic Bento Gallery Grid */}
        <div className="mt-14 grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-3 lg:grid-cols-4 auto-rows-[220px] sm:auto-rows-[260px]">
          {galleryItems.map((item, i) => (
            <Reveal
              key={item.id}
              delay={i * 0.06}
              className={`group relative overflow-hidden rounded-2xl border border-navy-700/15 bg-navy-900 shadow-md transition-all duration-300 hover:shadow-glow-cyan hover:border-ice-500/50 cursor-pointer ${item.span}`}
            >
              <div
                onClick={() => setSelectedImage(item)}
                className="relative h-full w-full"
              >
                <Image
                  src={item.src}
                  alt="Tehri Titans"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  priority={i === 0}
                />

                {/* Ambient dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

                {/* Top zoom indicator badge */}
                <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-navy-900/80 text-ice-500 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-ice-500/30">
                  <Maximize2 className="h-4 w-4" />
                </div>

                {/* Disclaimer overlay — Rights disclaimer */}
                <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col text-white">
                  <p className="text-[11px] text-ice-200/70 font-sans leading-tight font-medium">
                    All rights go to the original source of images
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Lightbox Modal for full image view */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/95 p-4 sm:p-8 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full overflow-hidden rounded-2xl border border-navy-700 bg-navy-900 shadow-2xl"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-navy-950/80 text-ice-200 hover:text-white hover:bg-navy-800 transition-colors border border-navy-700"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Lightbox Image */}
              <div className="relative h-[60vh] sm:h-[75vh] w-full bg-navy-950">
                <Image
                  src={selectedImage.src}
                  alt="Gallery Image"
                  fill
                  className="object-contain"
                />
              </div>

              {/* Lightbox Footer */}
              <div className="border-t border-navy-700/60 bg-navy-900 p-4 font-sans">
                <p className="text-xs text-ice-200/70 font-medium">
                  All rights go to the original source of images
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mountain outline line-art section divider before Collaboration section */}
      <MountainDivider className="mt-12 sm:mt-16" />
    </section>
  );
}
