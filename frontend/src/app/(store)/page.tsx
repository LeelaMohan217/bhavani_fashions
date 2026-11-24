import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { connection } from "next/server";
import { getBanners, getCategories, getProducts } from "@/lib/api";
import { discountPercent } from "@/lib/format";
import { STORY } from "@/lib/content";
import { ProductCard } from "@/components/product-card";
import { ProductGridSkeleton } from "@/components/skeletons";
import { BannerCarousel } from "@/components/home/banner-carousel";

/**
 * Product-first home page: offer banners (managed in Admin → Banners), quick category
 * links, new arrivals, the current sale, bestsellers, and why to buy here.
 * The brand story lives on /our-story.
 */
export default function HomePage() {
  return (
    <div className="pb-24 md:pb-32">
      <Suspense fallback={<BannersSkeleton />}>
        <Banners />
      </Suspense>

      <Suspense fallback={<CategoryLinksSkeleton />}>
        <CategoryLinks />
      </Suspense>

      <section className="container-x mt-14 md:mt-20" aria-labelledby="new-title">
        <Heading id="new-title" eyebrow="Just in" title="New arrivals" href="/shop?filter=new" />
        <Suspense fallback={<RowSkeleton />}>
          <ProductRow query={{ isNew: true, sort: "newest", pageSize: 8 }} scroll />
        </Suspense>
      </section>

      <Suspense fallback={null}>
        <SaleStrip />
      </Suspense>

      <section className="container-x mt-14 md:mt-20" aria-labelledby="best-title">
        <Heading id="best-title" eyebrow="Most loved" title="Bestsellers" href="/shop" linkLabel="Shop all" />
        <Suspense fallback={<div className="mt-6"><ProductGridSkeleton count={8} /></div>}>
          <ProductRow query={{ featured: true, pageSize: 8 }} />
        </Suspense>
      </section>

      <Reasons />
    </div>
  );
}

// ─── 1 · Offer banners ───────────────────────────────────────────────────────

async function Banners() {
  // Load at request time (not during the build) so deploys never depend on the API being up.
  await connection();
  const banners = await getBanners().catch(() => []);
  return <BannerCarousel banners={banners} />;
}

function BannersSkeleton() {
  return (
    <div className="md:container-x md:pt-6" aria-hidden>
      <div className="aspect-[4/5] max-h-[82svh] w-full animate-pulse bg-sand md:aspect-[21/8] md:max-h-none" />
    </div>
  );
}

// ─── 2 · Category links ──────────────────────────────────────────────────────

async function CategoryLinks() {
  await connection();
  const categories = await getCategories();
  const links = [
    ...categories.map((c) => ({ href: `/shop/${c.slug}`, label: c.name, image: c.imageUrl })),
    { href: "/shop?filter=new", label: "New In", image: STORY.image },
  ];

  return (
    <nav aria-label="Shop by category" className="container-x mt-8 md:mt-14">
      <ul className="-mx-5 flex gap-5 overflow-x-auto px-5 py-1 [scrollbar-width:none] sm:mx-0 sm:justify-center sm:px-0 md:gap-12 [&::-webkit-scrollbar]:hidden">
        {links.map((l) => (
          <li key={l.href} className="shrink-0">
            <Link href={l.href} className="group flex w-20 flex-col items-center gap-2.5 text-center md:w-28">
              <span className="relative size-[4.75rem] overflow-hidden rounded-full bg-sand ring-1 ring-line ring-offset-[3px] ring-offset-canvas transition-shadow group-hover:ring-ink md:size-[6.5rem]">
                {l.image && (
                  <Image
                    src={l.image}
                    alt=""
                    fill
                    sizes="104px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
              </span>
              <span className="text-xs font-medium text-ink md:text-sm">{l.label}</span>
            </Link>
          </li>
        ))}
        <li className="shrink-0">
          <Link href="/shop?filter=sale" className="group flex w-20 flex-col items-center gap-2.5 text-center md:w-28">
            <span className="flex size-[4.75rem] items-center justify-center rounded-full bg-clay text-canvas ring-1 ring-line ring-offset-[3px] ring-offset-canvas transition-colors group-hover:bg-clay-deep md:size-[6.5rem]">
              <span className="display text-xl italic md:text-2xl">Sale</span>
            </span>
            <span className="text-xs font-medium text-ink md:text-sm">On Sale</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function CategoryLinksSkeleton() {
  return (
    <div className="container-x mt-8 flex gap-5 overflow-hidden sm:justify-center md:mt-14 md:gap-12" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex w-20 shrink-0 flex-col items-center gap-2.5 md:w-28">
          <div className="size-[4.75rem] animate-pulse rounded-full bg-sand md:size-[6.5rem]" />
          <div className="h-3 w-14 animate-pulse bg-sand" />
        </div>
      ))}
    </div>
  );
}

// ─── Product rows ────────────────────────────────────────────────────────────

function Heading({
  id,
  eyebrow,
  title,
  href,
  linkLabel = "View all",
}: {
  id: string;
  eyebrow: string;
  title: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-line pb-4 md:pb-6">
      <div>
        <p className="eyebrow text-clay">{eyebrow}</p>
        <h2 id={id} className="display mt-2 text-[2rem] md:mt-3 md:text-6xl">
          {title}
        </h2>
      </div>
      <Link href={href} className="eyebrow group mb-1 inline-flex shrink-0 items-center gap-2 text-ink-soft hover:text-ink md:mb-2">
        <span className="link-draw pb-1">{linkLabel}</span>
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
      </Link>
    </div>
  );
}

/** `scroll`: a swipeable row on phones (a grid of four from md up). */
async function ProductRow({ query, scroll = false }: { query: Parameters<typeof getProducts>[0]; scroll?: boolean }) {
  await connection();
  const { items: all } = await getProducts(query);
  // Show complete rows of four on desktop so the grid never ends ragged
  const items = all.length >= 4 ? all.slice(0, all.length - (all.length % 4)) : all;

  if (items.length === 0) {
    return <p className="mt-6 text-sm text-stone">New pieces are on their way. Check back soon.</p>;
  }

  if (scroll) {
    return (
      <ul className="-mx-5 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:gap-x-6 md:gap-y-12 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((p) => (
          <li key={p.id} className="w-[44%] shrink-0 snap-start md:w-auto">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:mt-8 md:gap-x-6 md:gap-y-12 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="mt-6 flex gap-4 overflow-hidden md:grid md:grid-cols-4 md:gap-6" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="w-[44%] shrink-0 md:w-auto">
          <div className="aspect-[3/4] animate-pulse bg-sand" />
          <div className="mt-4 h-4 w-3/4 animate-pulse bg-sand" />
          <div className="mt-2 h-3 w-1/3 animate-pulse bg-sand" />
        </div>
      ))}
    </div>
  );
}

// ─── 4 · Sale strip (only while something is marked down) ────────────────────

async function SaleStrip() {
  await connection();
  const { items, total } = await getProducts({ sale: true, sort: "featured", pageSize: 48 });
  if (total === 0) return null;

  const best = Math.max(...items.map((p) => discountPercent(p.price, p.compareAtPrice) ?? 0));
  const image = items.find((p) => p.images[0])?.images[0];

  return (
    <section className="container-x mt-14 md:mt-20" aria-labelledby="sale-title">
      <Link href="/shop?filter=sale" className="group grid overflow-hidden bg-clay-deep text-canvas md:grid-cols-2">
        <div className="flex flex-col items-start justify-center p-6 md:p-12">
          <p className="eyebrow text-canvas/75">On sale now</p>
          <h2 id="sale-title" className="display mt-2 text-[2rem] md:mt-3 md:text-5xl">
            Up to <em className="italic">{best}% off</em>
          </h2>
          <p className="mt-3 text-sm text-canvas/85">
            {total} {total === 1 ? "piece" : "pieces"} marked down, while stocks last.
          </p>
          <span className="eyebrow mt-6 inline-flex items-center gap-3 border border-canvas/60 px-5 py-3 transition-colors group-hover:bg-canvas group-hover:text-ink">
            Shop the sale
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </span>
        </div>
        {image && (
          <div className="relative aspect-[16/10] md:aspect-auto md:min-h-80">
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-editorial)] group-hover:scale-[1.03]"
            />
          </div>
        )}
      </Link>
    </section>
  );
}

// ─── 6 · Why buy here ────────────────────────────────────────────────────────

function Reasons() {
  const items = [
    { icon: Truck, title: "Free shipping", text: "Across India" },
    { icon: RotateCcw, title: "7-day returns", text: "Easy and free" },
    { icon: ShieldCheck, title: "COD available", text: "UPI and cards too" },
    { icon: MessageCircle, title: "Styling help", text: "On WhatsApp" },
  ];
  return (
    <section className="container-x mt-14 md:mt-20" aria-label="Why shop with us">
      <ul className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-center gap-3 bg-canvas p-4 md:p-5">
            <Icon className="size-5 shrink-0 text-clay" strokeWidth={1.5} />
            <span>
              <span className="block text-sm font-medium">{title}</span>
              <span className="block text-xs text-stone">{text}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-center text-sm text-stone">
        Handpicked from India&rsquo;s weaving clusters.{" "}
        <Link href="/our-story" className="eyebrow link-draw ml-1 inline-flex items-center gap-1 pb-0.5 text-ink">
          Read our story <ArrowRight className="size-3" strokeWidth={1.5} />
        </Link>
      </p>
    </section>
  );
}
