import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Banner, Promotion } from "@/lib/types";

type Layout = "responsive" | "phone" | "desktop";
type Side = "LEFT" | "RIGHT";

/*
 * Class sets per layout. Phones: tall frame, copy at the bottom over a dark fade.
 * Tablet/desktop: the full-width photo, copy on the side without the model (textSide)
 * over a soft fade from that edge. Written out in full so Tailwind can find every class.
 */
const FRAME: Record<Layout, string> = {
  phone: "aspect-[4/5]",
  desktop: "aspect-[16/9]",
  responsive: "aspect-[4/5] max-h-[82svh] w-full md:aspect-[16/9] lg:max-h-[78svh]",
};

const SHADE: Record<Layout, Record<Side, string>> = {
  phone: {
    LEFT: "bg-gradient-to-t from-ink/75 via-ink/25 to-transparent",
    RIGHT: "bg-gradient-to-t from-ink/75 via-ink/25 to-transparent",
  },
  desktop: {
    LEFT: "bg-gradient-to-r from-ink/65 via-ink/25 to-transparent",
    RIGHT: "bg-gradient-to-l from-ink/65 via-ink/25 to-transparent",
  },
  responsive: {
    LEFT: "bg-gradient-to-t from-ink/75 via-ink/25 to-transparent md:bg-gradient-to-r md:from-ink/65",
    RIGHT: "bg-gradient-to-t from-ink/75 via-ink/25 to-transparent md:bg-gradient-to-l md:from-ink/65",
  },
};

const COPY: Record<Layout, Record<Side, string>> = {
  phone: {
    LEFT: "inset-x-0 bottom-0 px-6 pb-14 pt-7",
    RIGHT: "inset-x-0 bottom-0 px-6 pb-14 pt-7",
  },
  desktop: {
    LEFT: "inset-y-0 left-0 flex w-[42%] flex-col items-start justify-center px-8",
    RIGHT: "inset-y-0 right-0 flex w-[42%] flex-col items-start justify-center px-8",
  },
  responsive: {
    // Narrow column (about a third of the banner) so the copy stays clear of the model
    LEFT: "inset-x-0 bottom-0 px-6 pb-14 pt-7 md:inset-y-0 md:right-auto md:flex md:w-[42%] md:flex-col md:items-start md:justify-center md:px-10 md:pb-14 lg:w-[36%] lg:pl-16 lg:pr-0",
    RIGHT: "inset-x-0 bottom-0 px-6 pb-14 pt-7 md:inset-y-0 md:left-auto md:flex md:w-[42%] md:flex-col md:items-start md:justify-center md:px-10 md:pb-14 lg:w-[36%] lg:pl-0 lg:pr-16",
  },
};

const TITLE: Record<Layout, string> = {
  phone: "text-[2.4rem]",
  desktop: "text-3xl",
  responsive: "text-[2.5rem] md:text-[2.75rem] lg:text-[3.5rem]",
};

/**
 * One home-page offer banner, shared by the storefront carousel and the admin banner preview.
 */
export function BannerSlide({
  banner,
  priority = false,
  layout = "responsive",
  preview = false,
  promo = null,
}: {
  banner: Pick<Banner, "eyebrow" | "title" | "highlight" | "subtitle" | "ctaLabel" | "ctaHref" | "imageUrl" | "imageAlt" | "textSide">;
  priority?: boolean;
  /** Force one layout (the admin preview shows phone and desktop side by side) */
  layout?: Layout;
  /** Admin preview: no navigation, plain <img> so any pasted URL shows */
  preview?: boolean;
  /** While a store-wide offer runs, the small label announces it */
  promo?: Promotion | null;
}) {
  const side: Side = banner.textSide === "RIGHT" ? "RIGHT" : "LEFT";

  const cta = (
    <span className="eyebrow mt-6 inline-flex items-center gap-3 bg-canvas px-6 py-4 text-ink transition-colors group-hover:bg-sand">
      {banner.ctaLabel || "Shop now"}
      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
    </span>
  );

  return (
    <div className={`relative overflow-hidden bg-sand ${FRAME[layout]}`}>
      {banner.imageUrl &&
        (preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview of an unsaved URL
          <img src={banner.imageUrl} alt="" className="absolute inset-0 size-full object-cover object-[center_25%]" />
        ) : (
          <Image
            src={banner.imageUrl}
            alt={banner.imageAlt}
            fill
            priority={priority}
            // Later slides load straight away too, so they're ready before the carousel reaches them
            loading={priority ? undefined : "eager"}
            sizes="(min-width: 1280px) 1240px, 100vw"
            // Slightly above centre: keeps heads in frame while showing as much of the outfit as fits
            className="object-cover object-[center_25%]"
          />
        ))}
      <div className={`absolute inset-0 ${SHADE[layout][side]}`} aria-hidden />
      <div className={`absolute text-canvas ${COPY[layout][side]}`}>
        {promo ? (
          <p className="eyebrow inline-block whitespace-nowrap bg-canvas px-2.5 py-1.5 text-ink">
            {promo.name} · {promo.percentOff}% off
          </p>
        ) : (
          banner.eyebrow && <p className="eyebrow text-canvas/80">{banner.eyebrow}</p>
        )}
        <h2 className={`display mt-3 text-balance drop-shadow-sm ${TITLE[layout]}`}>
          {banner.title || "Your headline"}
          {banner.highlight && <> <em className="italic">{banner.highlight}</em></>}
        </h2>
        {banner.subtitle && (
          <p className={`mt-3 max-w-md text-sm text-canvas/90 ${layout === "responsive" ? "md:text-base" : ""}`}>{banner.subtitle}</p>
        )}
        {preview ? (
          <span className="group">{cta}</span>
        ) : (
          <Link href={banner.ctaHref} className="group">
            {cta}
          </Link>
        )}
      </div>
    </div>
  );
}
