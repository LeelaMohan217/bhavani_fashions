import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { infoMetadata } from "@/components/info-page";
import { HERO, STORY } from "@/lib/content";

export const metadata = infoMetadata("our-story");

/** The brand story (moved here from the home page, which now leads with products). */
export default function OurStoryPage() {
  return (
    <div className="pb-24 md:pb-32">
      <section className="container-x grid gap-10 pt-10 md:grid-cols-12 md:gap-6 md:pt-16">
        <div className="flex flex-col justify-between md:col-span-5 md:py-6">
          <div>
            <nav aria-label="Breadcrumb" className="eyebrow flex items-center gap-2 text-stone">
              <Link href="/" className="hover:text-ink">Home</Link>
              <span aria-hidden>/</span>
              <span className="text-ink">Our story</span>
            </nav>
            <h1 className="display mt-8 text-[3.2rem] sm:text-7xl lg:text-[5.5rem]">
              Woven for the moments <em className="italic text-clay">you</em> keep.
            </h1>
            <p className="mt-7 max-w-sm text-[0.95rem] leading-relaxed text-ink-soft">
              Handloom sarees, festive lehengas and easy kurta sets, handpicked from India&rsquo;s weaving clusters and
              delivered to your door.
            </p>
          </div>

          <figure className="mt-14 hidden items-end gap-5 md:flex">
            <div className="relative aspect-[4/5] w-36 shrink-0 overflow-hidden bg-sand lg:w-44">
              <Image src={HERO.inset} alt={HERO.insetAlt} fill sizes="176px" className="object-cover" />
            </div>
            <figcaption className="max-w-[13rem] pb-1 text-xs leading-relaxed text-stone">
              <span className="eyebrow block text-ink">Tussar silk detail</span>
              <span className="mt-2 block">Antique-gold zari, hand-finished in Bhagalpur.</span>
            </figcaption>
          </figure>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden bg-sand md:col-span-7 md:aspect-[5/6]">
          <Image src={HERO.image} alt={HERO.imageAlt} fill priority sizes="(min-width: 768px) 58vw, 100vw" className="object-cover" />
        </div>
      </section>

      <section className="mt-20 bg-sand md:mt-32" aria-labelledby="craft-title">
        <div className="container-x grid gap-12 py-20 md:grid-cols-12 md:items-center md:gap-6 md:py-28">
          <div className="relative aspect-[4/5] overflow-hidden md:col-span-5">
            <Image src={STORY.image} alt={STORY.imageAlt} fill sizes="(min-width: 768px) 42vw, 100vw" className="object-cover" />
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <p className="eyebrow text-clay">Our craft</p>
            <h2 id="craft-title" className="display mt-5 text-[2.6rem] md:text-[4.25rem]">
              From the loom to your wardrobe, <em className="italic">with nothing lost between.</em>
            </h2>
            <p className="mt-8 max-w-lg leading-relaxed text-ink-soft">
              We work directly with weavers in Kanchipuram, Varanasi, Chanderi and Bengal. No middlemen and no mass
              production, just honest prices for cloth that was made slowly, by hand, and made to last.
            </p>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-ink/15 pt-8">
              {[
                ["12", "Weaving clusters"],
                ["300+", "Artisan families"],
                ["100%", "Handpicked"],
              ].map(([value, label]) => (
                <div key={label} className="flex flex-col">
                  <dt className="eyebrow order-2 mt-2 text-[0.6rem] text-stone">{label}</dt>
                  <dd className="display order-1 text-4xl md:text-5xl">{value}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/shop"
              className="eyebrow group mt-12 inline-flex items-center gap-3 bg-ink px-7 py-[1.1rem] text-canvas transition-colors hover:bg-clay-deep"
            >
              Shop the collection
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
