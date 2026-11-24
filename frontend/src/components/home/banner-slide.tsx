import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Banner, Promotion } from "@/lib/types";

/**
 * One home-page offer banner. Phones: tall photo, copy at the bottom. Desktop: wide photo,
 * copy on the left. Shared by the storefront carousel and the admin banner preview.
 */
export function BannerSlide({
  banner,
  priority = false,
  layout = "responsive",
  preview = false,
  promo = null,
}: {
  banner: Pick<Banner, "eyebrow" | "title" | "highlight" | "subtitle" | "ctaLabel" | "ctaHref" | "imageUrl" | "imageAlt">;
  priority?: boolean;
  /** Force one layout (the admin preview shows phone and desktop side by side) */
  layout?: "responsive" | "phone" | "desktop";
  /** Admin preview: no navigation, plain <img> so any pasted URL shows */
  preview?: boolean;
  /** While a store-wide offer runs, the small label announces it in gold */
  promo?: Promotion | null;
}) {
  const phone = layout === "phone";
  const desk = layout === "desktop";
  const r = layout === "responsive";

  const frame = phone ? "aspect-[4/5]" : desk ? "aspect-[21/8]" : "aspect-[4/5] max-h-[82svh] w-full md:aspect-[21/8] md:max-h-none";
  const shade = phone
    ? "bg-gradient-to-t from-ink/75 via-ink/25 to-transparent"
    : desk
      ? "bg-gradient-to-r from-ink/70 via-ink/25 to-transparent"
      : "bg-gradient-to-t from-ink/75 via-ink/25 to-transparent md:bg-gradient-to-r md:from-ink/70";
  const copy = phone
    ? "inset-x-0 bottom-0 px-6 pb-14 pt-7"
    : desk
      ? "inset-y-0 left-0 flex w-1/2 flex-col items-start justify-center px-12"
      : "inset-x-0 bottom-0 px-6 pb-14 pt-7 md:inset-y-0 md:right-auto md:flex md:w-1/2 md:flex-col md:items-start md:justify-center md:px-14 md:pb-14";
  const titleSize = phone ? "text-[2.4rem]" : desk ? "text-5xl" : "text-[2.5rem] sm:text-5xl lg:text-[4.25rem]";

  const cta = (
    <span className="eyebrow mt-6 inline-flex items-center gap-3 bg-canvas px-6 py-4 text-ink transition-colors group-hover:bg-sand">
      {banner.ctaLabel || "Shop now"}
      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
    </span>
  );

  return (
    <div className={`relative overflow-hidden bg-sand ${frame}`}>
      {banner.imageUrl &&
        (preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview of an unsaved URL
          <img src={banner.imageUrl} alt="" className="absolute inset-0 size-full object-cover object-top" />
        ) : (
          <Image
            src={banner.imageUrl}
            alt={banner.imageAlt}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 1240px, 100vw"
            // Anchor to the top so heads and faces are never cut off
            className="object-cover object-top"
          />
        ))}
      <div className={`absolute inset-0 ${shade}`} aria-hidden />
      <div className={`absolute text-canvas ${copy}`}>
        {promo ? (
          <p className="eyebrow inline-block bg-canvas px-2.5 py-1.5 text-ink">
            {promo.name} · {promo.percentOff}% off
          </p>
        ) : (
          banner.eyebrow && <p className="eyebrow text-canvas/80">{banner.eyebrow}</p>
        )}
        <h2 className={`display mt-3 text-balance ${titleSize}`}>
          {banner.title || "Your headline"}
          {banner.highlight && <> <em className="italic">{banner.highlight}</em></>}
        </h2>
        {banner.subtitle && <p className={`mt-3 max-w-md text-sm text-canvas/85 ${r ? "md:text-base" : ""}`}>{banner.subtitle}</p>}
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
