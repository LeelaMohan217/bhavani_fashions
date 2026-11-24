"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/lib/types";

/**
 * Mobile: swipeable full-width carousel with a progress indicator.
 * Desktop: images stacked in an editorial column beside the sticky purchase panel.
 */
export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (images.length === 0) {
    return <div className="aspect-[3/4] bg-sand" aria-label={`${name} — image coming soon`} />;
  }

  return (
    <div>
      {/* Mobile carousel */}
      <div className="relative md:hidden">
        <div
          ref={track}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
        >
          {images.map((img, i) => (
            <div key={img.url} className="relative aspect-[3/4] w-full shrink-0 snap-center bg-sand">
              <Image src={img.url} alt={img.alt} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute inset-x-5 bottom-4 flex gap-1.5" aria-hidden>
            {images.map((img, i) => (
              <span
                key={img.url}
                className={`h-[2px] flex-1 transition-colors duration-500 ${i === index ? "bg-canvas" : "bg-canvas/35"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop stack */}
      <div className="hidden gap-3 md:grid">
        {images.map((img, i) => (
          <div key={img.url} className="relative aspect-[3/4] overflow-hidden bg-sand">
            <Image
              src={img.url}
              alt={img.alt}
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 55vw, 60vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
