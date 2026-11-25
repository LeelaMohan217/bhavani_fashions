"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/lib/types";

/**
 * Phones: swipeable full-width carousel with a progress indicator.
 * Tablet/desktop: a large photo with thumbnails below (click or hover a thumbnail to switch).
 */
export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (images.length === 0) {
    return <div className="aspect-[3/4] bg-sand" aria-label={`${name}, image coming soon`} />;
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

      {/* Tablet/desktop: one large photo, thumbnails underneath */}
      <div className="hidden md:block">
        <div className="relative aspect-[4/5] overflow-hidden bg-sand">
          {images.map((img, i) => (
            <Image
              key={img.url}
              src={img.url}
              alt={i === active ? img.alt : ""}
              fill
              priority={i === 0}
              // Every photo loads up front so switching is instant; only the chosen one shows
              loading="eager"
              sizes="(min-width: 1280px) 600px, 50vw"
              className={`object-cover transition-opacity duration-300 ${i === active ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
        {images.length > 1 && (
          <ul className="mt-2.5 grid grid-cols-6 gap-2" aria-label="Choose a photo">
            {images.map((img, i) => (
              <li key={img.url}>
                <button
                  type="button"
                  aria-label={`Show photo ${i + 1} of ${images.length}`}
                  aria-current={i === active}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  className={`relative block aspect-[3/4] w-full overflow-hidden bg-sand outline-offset-2 transition ${
                    i === active ? "ring-1 ring-ink ring-offset-2 ring-offset-canvas" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img.url} alt="" fill sizes="120px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
