"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/types";
import { BannerSlide } from "./banner-slide";

const INTERVAL_MS = 6000;

/** Home-page offer banners: swipe on phones, dots/arrows on desktop, auto-advances every 6s. */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  // Paused while the shopper hovers, focuses or touches the banners
  const [paused, setPaused] = useState(false);
  const count = banners.length;

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = (i + count) % count;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  // Keep the dots in step with swipes
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setCurrent(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      const el = track.current;
      if (!el || document.hidden) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      el.scrollTo({ left: ((i + 1) % count) * el.clientWidth, behavior: "smooth" });
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Offers"
      className="group/carousel relative md:container-x md:pt-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div className="relative">
        <div
          ref={track}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {banners.map((b, i) => (
            <div
              key={b.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              className="w-full shrink-0 snap-start"
            >
              <BannerSlide banner={b} priority={i === 0} />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <div className="absolute bottom-6 left-6 flex items-center gap-2 md:bottom-8 md:left-14">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show banner ${i + 1}`}
                  aria-current={i === current}
                  className="flex h-6 items-center"
                >
                  <span className={`block h-[3px] rounded-full transition-all duration-300 ${i === current ? "w-8 bg-canvas" : "w-4 bg-canvas/45"}`} />
                </button>
              ))}
            </div>
            <div className="absolute bottom-5 right-5 hidden gap-2 opacity-0 transition-opacity group-hover/carousel:opacity-100 group-focus-within/carousel:opacity-100 md:flex">
              <button
                type="button"
                onClick={() => go(current - 1)}
                aria-label="Previous banner"
                className="inline-flex size-11 items-center justify-center rounded-full border border-canvas/50 text-canvas transition-colors hover:bg-canvas hover:text-ink"
              >
                <ChevronLeft className="size-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => go(current + 1)}
                aria-label="Next banner"
                className="inline-flex size-11 items-center justify-center rounded-full border border-canvas/50 text-canvas transition-colors hover:bg-canvas hover:text-ink"
              >
                <ChevronRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
