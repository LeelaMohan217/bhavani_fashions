"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner, Promotion } from "@/lib/types";
import { BannerSlide } from "./banner-slide";
import { PromoSlide } from "@/components/promo/promo-slide";
import { useCountdown } from "@/components/promo/countdown";

const INTERVAL_MS = 6000;

/** Home-page offer banners: swipe on phones, dots/arrows on desktop, auto-advances every 6s. */
export function BannerCarousel({ banners, promotion }: { banners: Banner[]; promotion: Promotion | null }) {
  const track = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  // Paused while the shopper hovers, focuses or touches the banners
  const [paused, setPaused] = useState(false);
  // A running store-wide offer gets its own first slide; it drops out the second the offer ends
  const t = useCountdown(promotion?.endsAt ?? "1970-01-01T00:00:00Z");
  const promo = promotion && !t?.ended ? promotion : null;
  const slides = [
    ...(promo ? [{ key: "promotion", node: (first: boolean) => <PromoSlide promo={promo} priority={first} /> }] : []),
    ...banners.map((b) => ({ key: b.id, node: (first: boolean) => <BannerSlide banner={b} priority={first} promo={promo} /> })),
  ];
  const count = slides.length;

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
      className="group/carousel container-x relative pt-3 md:pt-6"
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
          {slides.map((sl, i) => (
            <div
              key={sl.key}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              className="w-full shrink-0 snap-start"
            >
              {sl.node(i === 0)}
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <div className="absolute bottom-6 left-6 flex items-center gap-2 md:bottom-8 md:left-14">
              {slides.map((sl, i) => (
                <button
                  key={sl.key}
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
