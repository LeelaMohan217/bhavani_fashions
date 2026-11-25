import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, RotateCcw, ShoppingBag, Truck } from "lucide-react";
import { getProduct } from "@/lib/api";
import { Gallery } from "@/components/product/gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { DetailTabs, type DetailTab } from "@/components/product/detail-tabs";
import { cardFromDetail } from "@/lib/product-card";
import { Price } from "@/components/price";
import { ProductCard, boughtLabel } from "@/components/product-card";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Not found" };
  return {
    title: product.name,
    description: product.description,
    openGraph: { images: product.images[0] ? [product.images[0].url] : [] },
  };
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <Product params={params} />
    </Suspense>
  );
}

async function Product({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const colours = [...new Set(product.variants.map((v) => v.color))];
  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];
  const sizes = [...new Set(product.variants.map((v) => v.size).filter((s): s is string => Boolean(s)))].sort(
    (a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b),
  );
  const bought = boughtLabel(product.sold);

  const tabs: DetailTab[] = [
    {
      title: "Description",
      body: (
        <>
          <p>{product.description}</p>
          <h3 className="mt-6 font-medium text-ink">Details</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-stone">
            <li>Category: {product.category.name}</li>
            {product.fabric && <li>Fabric: {product.fabric}</li>}
            {product.occasion && <li>Occasion: {product.occasion}</li>}
            {colours.length > 0 && <li>Colours: {colours.join(", ")}</li>}
            <li>{sizes.length > 0 ? `Sizes: ${sizes.join(", ")}` : "Free size"}</li>
          </ul>
        </>
      ),
    },
    {
      title: "Fabric & care",
      body: (
        <>
          {product.fabric && <p>Woven in {product.fabric.toLowerCase()}.</p>}
          <p className={product.fabric ? "mt-3" : ""}>{product.care || "Dry clean recommended for the first wash."}</p>
        </>
      ),
    },
    {
      title: "Shipping & returns",
      body: (
        <ul className="list-disc space-y-1.5 pl-5 marker:text-stone">
          <li>Free shipping across India.</li>
          <li>Dispatched within 48 hours and delivered in 4 to 7 working days.</li>
          <li>Returns and exchanges within 7 days of delivery, on unworn pieces with tags intact.</li>
          <li>Cash on delivery available.</li>
        </ul>
      ),
    },
  ];

  return (
    <>
      <div className="container-x pt-4 md:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-7 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-10 lg:gap-14">
            {/* Phones: photos run edge to edge */}
            <div className="-mx-5 md:mx-0">
              <Gallery images={product.images} name={product.name} />
            </div>

            <div>
              <div className="md:sticky md:top-24">
                <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-xs text-stone">
                  <Link href="/" className="shrink-0 hover:text-ink">Home</Link>
                  <ChevronRight className="size-3 shrink-0" strokeWidth={1.5} aria-hidden />
                  <Link href={`/shop/${product.category.slug}`} className="shrink-0 hover:text-ink">
                    {product.category.name}
                  </Link>
                  <ChevronRight className="size-3 shrink-0" strokeWidth={1.5} aria-hidden />
                  <span className="truncate text-ink-soft">{product.name}</span>
                </nav>

                <h1 className="display mt-3 text-[1.75rem] leading-tight md:text-[2rem]">{product.name}</h1>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-stone">
                  {product.fabric && <span>{product.fabric}</span>}
                  {product.occasion && (
                    <>
                      <span className="size-1 rounded-full bg-stone/40" aria-hidden />
                      <span>{product.occasion}</span>
                    </>
                  )}
                  {product.isNewArrival && (
                    <>
                      <span className="size-1 rounded-full bg-stone/40" aria-hidden />
                      <span className="text-clay">New arrival</span>
                    </>
                  )}
                </div>

                <div className="mt-4">
                  <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
                  <p className="mt-0.5 text-[0.7rem] text-stone">Inclusive of all taxes</p>
                </div>

                {bought && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
                    <ShoppingBag className="size-3.5 text-clay" strokeWidth={1.5} aria-hidden />
                    {bought}
                  </p>
                )}

                <div className="mt-5 border-t border-line pt-5">
                  <PurchasePanel product={cardFromDetail(product)} variants={product.variants} />
                </div>

                <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-4 text-[0.7rem] text-stone">
                  <li className="flex items-center gap-2">
                    <Truck className="size-3.5" strokeWidth={1.5} aria-hidden />
                    Free delivery in 4 to 7 days
                  </li>
                  <li className="flex items-center gap-2">
                    <RotateCcw className="size-3.5" strokeWidth={1.5} aria-hidden />
                    Easy 7-day returns
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <section aria-label="Product details" className="mt-12 border-t border-line pt-8 md:mt-16 md:pt-10">
            <DetailTabs tabs={tabs} />
          </section>
        </div>
      </div>

      {product.related.length > 0 && (
        <section className="container-x mt-28 pb-24 md:mt-40 md:pb-32" aria-labelledby="related-title">
          <div className="border-b border-line pb-6">
            <p className="eyebrow text-clay">You may also love</p>
            <h2 id="related-title" className="display mt-3 text-[2.5rem] md:text-5xl">
              More from {product.category.name}
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
            {product.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-x pt-4 md:pt-8" aria-busy>
      <div className="mx-auto grid max-w-5xl gap-7 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-10 lg:gap-14">
        <div className="-mx-5 md:mx-0">
          <div className="aspect-[3/4] animate-pulse bg-sand md:aspect-[4/5]" />
          <div className="mt-3 hidden grid-cols-5 gap-3 md:grid">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse bg-sand" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-3 w-40 animate-pulse bg-sand" />
          <div className="h-10 w-4/5 animate-pulse bg-sand" />
          <div className="h-4 w-32 animate-pulse bg-sand" />
          <div className="h-7 w-36 animate-pulse bg-sand" />
          <div className="!mt-8 h-9 w-48 animate-pulse bg-sand" />
          <div className="h-14 w-full animate-pulse bg-sand" />
        </div>
      </div>
    </div>
  );
}
