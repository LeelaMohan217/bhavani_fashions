"use client";

import Link from "next/link";
import type { Promotion } from "@/lib/types";
import { pad, useCountdown } from "./countdown";

/** Black Friday top bar with a live countdown. Shows `fallback` (the usual bar) once the offer ends. */
export function PromoBar({ promo, fallback }: { promo: Promotion; fallback: React.ReactNode }) {
  const t = useCountdown(promo.endsAt);
  if (t?.ended) return <>{fallback}</>;

  return (
    <Link
      href="/shop?filter=sale"
      className="eyebrow block bg-night px-4 py-2.5 text-center text-[0.625rem] text-canvas transition-colors hover:text-gold"
      aria-label={`${promo.name}: ${promo.percentOff}% off everything. Shop the sale`}
    >
      <span className="font-semibold text-gold">{promo.name}</span>
      <span className="px-2 text-gold">·</span>
      {promo.percentOff}% off everything
      <span className="px-2 text-gold">·</span>
      <span className="tabular-nums text-gold">
        {t ? `${t.days > 0 ? `${t.days}d ` : ""}${pad(t.hours)}h ${pad(t.minutes)}m` : "Ends soon"}
      </span>{" "}
      left
    </Link>
  );
}
