import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MessageCircle, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { connection } from "next/server";
import { getCategories, getProducts } from "@/lib/api";
import { HERO, STORY } from "@/lib/content";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { ProductGridSkeleton } from "@/components/skeletons";

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="container-x mt-28 md:mt-40" aria-labelledby="categories-title">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6">
            <p className="eyebrow text-clay">Shop by category</p>
            <h2 id="categories-title" className="display mt-3 text-[2.5rem] md:text-6xl">
              Three ways to <em className="italic">drape</em> the season
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-stone md:col-span-4 md:col-start-9">
            From six-yard heirlooms to easy everyday sets — each piece is chosen by hand and
            checked twice before it reaches you.
          </p>
        </div>
        <Suspense fallback={<CategoriesSkeleton />}>
          <Categories />
        </Suspense>
      </section>

      <section className="container-x mt-28 md:mt-40" aria-label="New arrivals">
        <SectionHeading eyebrow="Just in" title="New arrivals" href="/shop?filter=new" />
        <div className="mt-10">
          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <ProductRow query={{ isNew: true, sort: "newest", pageSize: 4 }} />
          </Suspense>
        </div>
      </section>

      <Story />

      <section className="container-x mt-28 md:mt-40" aria-label="The Bhavani edit">
        <SectionHeading
          eyebrow="Most loved"
          title={
            <>
              The Bhavani <em className="italic">edit</em>
            </>
          }
          href="/shop"
          linkLabel="Shop everything"
        />
        <div className="mt-10">
          <Suspense fallback={<ProductGridSkeleton count={8} />}>
            <ProductRow query={{ featured: true, pageSize: 8 }} />
          </Suspense>
        </div>
      </section>

      <Services />
    </>
  );
}

function Hero() {
  return (
    <section className="container-x grid gap-10 pt-6 md:grid-cols-12 md:gap-6 md:pt-10">
      <div className="flex flex-col justify-between md:col-span-5 md:py-6">
        <div className="animate-rise">
          <p className="eyebrow text-clay">{HERO.eyebrow}</p>
          <h1 className="display mt-6 text-[3.4rem] sm:text-7xl lg:text-[6.25rem]">
            Woven for the moments <em className="italic text-clay">you</em> keep.
          </h1>
          <p className="mt-7 max-w-sm text-[0.95rem] leading-relaxed text-ink-soft">
            Handloom sarees, festive lehengas and easy kurta sets — handpicked from India&rsquo;s
            weaving clusters and delivered to your door.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href="/shop/sarees"
              className="eyebrow group inline-flex items-center gap-3 bg-ink px-7 py-[1.1rem] text-canvas transition-colors hover:bg-clay-deep"
            >
              Shop sarees
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
            <Link href="/shop?filter=new" className="eyebrow link-draw pb-1">
              New arrivals
            </Link>
          </div>
        </div>

        <figure className="mt-14 hidden items-end gap-5 md:flex">
          <div className="relative aspect-[4/5] w-36 shrink-0 overflow-hidden bg-sand lg:w-44">
            <Image src={HERO.inset} alt={HERO.insetAlt} fill sizes="176px" className="object-cover" />
          </div>
          <figcaption className="max-w-[13rem] pb-1 text-xs leading-relaxed text-stone">
            <span className="eyebrow block text-ink">Detail — Tussar silk</span>
            <span className="mt-2 block">Antique-gold zari, hand-finished in Bhagalpur.</span>
          </figcaption>
        </figure>
      </div>

      <div className="relative md:col-span-7">
        <div className="relative aspect-[4/5] overflow-hidden bg-sand md:aspect-[5/6]">
          <Image
            src={HERO.image}
            alt={HERO.imageAlt}
            fill
            priority
            sizes="(min-width: 768px) 58vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/45 to-transparent" />
        </div>
        <Link
          href={HERO.featured.href}
          className="group absolute bottom-5 left-5 right-5 flex items-center justify-between text-canvas md:bottom-8 md:left-8 md:right-8"
        >
          <span>
            <span className="eyebrow block text-canvas/75">As worn</span>
            <span className="display mt-1 block text-2xl md:text-3xl">{HERO.featured.name}</span>
          </span>
          <span className="inline-flex size-11 items-center justify-center rounded-full border border-canvas/50 transition-colors group-hover:bg-canvas group-hover:text-ink">
            <ArrowUpRight className="size-4" strokeWidth={1.5} />
          </span>
        </Link>
      </div>
    </section>
  );
}

async function Categories() {
  // Load at request time (not during the build) so deploys never depend on the API being up.
  await connection();
  const categories = await getCategories();

  return (
    <ul className="mt-12 grid gap-x-6 gap-y-14 md:mt-16 md:grid-cols-3">
      {categories.map((c, i) => (
        <li key={c.id} className={i === 1 ? "md:mt-24" : ""}>
          <Link href={`/shop/${c.slug}`} className="group block">
            <div className="relative aspect-[3/4] overflow-hidden bg-sand">
              {c.imageUrl && (
                <Image
                  src={c.imageUrl}
                  alt={c.name}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-editorial)] group-hover:scale-[1.04]"
                />
              )}
            </div>
            <div className="mt-5 flex items-baseline justify-between gap-4">
              <div>
                <p className="eyebrow text-stone">0{i + 1} — {c.tagline}</p>
                <h3 className="display mt-2 text-4xl">{c.name}</h3>
              </div>
              <span className="eyebrow inline-flex items-center gap-2 whitespace-nowrap text-ink-soft group-hover:text-clay">
                {c.productCount} pieces
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className={i === 1 ? "md:mt-24" : ""}>
          <div className="aspect-[3/4] animate-pulse bg-sand" />
          <div className="mt-5 h-8 w-1/2 animate-pulse bg-sand" />
        </div>
      ))}
    </div>
  );
}

async function ProductRow({ query }: { query: Parameters<typeof getProducts>[0] }) {
  await connection();
  const { items: all } = await getProducts(query);
  // Show complete rows of four on desktop so the editorial grid never ends ragged
  const items = all.length >= 4 ? all.slice(0, all.length - (all.length % 4)) : all;

  if (items.length === 0) {
    return <p className="text-sm text-stone">New pieces are on their way — check back soon.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function Story() {
  return (
    <section className="mt-28 bg-sand md:mt-40" aria-labelledby="story-title">
      <div className="container-x grid gap-12 py-20 md:grid-cols-12 md:items-center md:gap-6 md:py-28">
        <div className="relative aspect-[4/5] overflow-hidden md:col-span-5">
          <Image src={STORY.image} alt={STORY.imageAlt} fill sizes="(min-width: 768px) 42vw, 100vw" className="object-cover" />
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <p className="eyebrow text-clay">Our craft</p>
          <h2 id="story-title" className="display mt-5 text-[2.6rem] md:text-[4.25rem]">
            From the loom to your wardrobe — <em className="italic">with nothing lost between.</em>
          </h2>
          <p className="mt-8 max-w-lg leading-relaxed text-ink-soft">
            We work directly with weavers in Kanchipuram, Varanasi, Chanderi and Bengal. No
            middlemen, no mass production — just honest prices for cloth that was made slowly,
            by hand, and made to last.
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
        </div>
      </div>
    </section>
  );
}

function Services() {
  const items = [
    { icon: Truck, title: "Free shipping", text: "On every order across India, delivered in 4–7 days." },
    { icon: RotateCcw, title: "7-day returns", text: "Not quite right? Return or exchange, no questions." },
    { icon: ShieldCheck, title: "Secure checkout", text: "UPI, cards, net banking and cash on delivery." },
    { icon: MessageCircle, title: "Styling on WhatsApp", text: "Real people to help you choose the right drape." },
  ];

  return (
    <section className="container-x mt-28 border-t border-line md:mt-40" aria-label="Our promises">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }, i) => (
          <li
            key={title}
            className={`flex gap-4 py-10 lg:px-8 ${i > 0 ? "border-t border-line sm:border-t-0 lg:border-l" : "lg:pl-0"} ${
              i === 2 ? "sm:border-t lg:border-t-0" : ""
            } ${i === 3 ? "sm:border-t lg:border-t-0" : ""} ${i % 2 === 1 ? "sm:border-l sm:pl-8" : ""}`}
          >
            <Icon className="mt-0.5 size-5 shrink-0 text-clay" strokeWidth={1.25} />
            <div>
              <h3 className="font-display text-lg">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
