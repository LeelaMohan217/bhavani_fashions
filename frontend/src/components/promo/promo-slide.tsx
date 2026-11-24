"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PROMO_IMAGE } from "@/lib/content";
import type { Promotion } from "@/lib/types";
import { endDay, pad, useCountdown } from "./countdown";

/** The Black Friday banner: night and gold, % off, and a live countdown to the end. */
export function PromoSlide({ promo, priority = false }: { promo: Promotion; priority?: boolean }) {
  const t = useCountdown(promo.endsAt);
  const units = [
    ["Days", t?.days],
    ["Hrs", t?.hours],
    ["Min", t?.minutes],
    ["Sec", t?.seconds],
  ] as const;

  return (
    <div className="relative aspect-[4/5] max-h-[82svh] w-full overflow-hidden bg-night md:aspect-[21/8] md:max-h-none">
      <Image
        src={PROMO_IMAGE.src}
        alt={PROMO_IMAGE.alt}
        fill
        priority={priority}
        sizes="(min-width: 1280px) 1240px, 100vw"
        className="object-cover object-top opacity-85"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-night via-night/70 to-night/10 md:bg-gradient-to-r md:from-night md:via-night/80 md:to-night/5"
      />
      <div className="absolute inset-x-0 bottom-0 px-6 pb-14 pt-7 text-canvas md:inset-y-0 md:right-auto md:flex md:w-[55%] md:flex-col md:items-start md:justify-center md:px-14">
        <p className="eyebrow text-gold">Ends {endDay(promo.endsAt)} · Midnight</p>
        <h2 className="display mt-3 text-[3.1rem] leading-[0.95] sm:text-6xl lg:text-[5.25rem]">
          {promo.name} <em className="italic text-gold">sale</em>
        </h2>
        <p className="mt-4 text-lg md:text-xl">
          <b className="font-semibold text-gold">{promo.percentOff}% off</b> everything. Sarees, lehengas and kurta sets.
        </p>
        <div className="mt-5 flex gap-2" role="timer" aria-label="Time left in the sale">
          {units.map(([label, v]) => (
            <div key={label} className="min-w-14 border border-gold/45 px-1.5 py-2 text-center md:min-w-16">
              <b className="display block text-[1.6rem] font-normal leading-none tabular-nums md:text-3xl">
                {v === undefined ? "–" : label === "Days" ? v : pad(v)}
              </b>
              <small className="eyebrow mt-1.5 block text-[0.55rem] text-canvas/60">{label}</small>
            </div>
          ))}
        </div>
        <Link href="/shop?filter=sale" className="group">
          <span className="eyebrow mt-6 inline-flex items-center gap-3 bg-gold px-6 py-4 text-night transition-colors group-hover:bg-canvas">
            Shop the sale
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </span>
        </Link>
      </div>
    </div>
  );
}
