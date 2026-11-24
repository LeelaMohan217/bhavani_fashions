import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, RotateCcw, Truck } from "lucide-react";
import { getProduct } from "@/lib/api";
import { Gallery } from "@/components/product/gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { cardFromDetail } from "@/lib/product-card";
import { Price } from "@/components/price";
import { ProductCard } from "@/components/product-card";

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

  const details = [
    { title: "The piece", body: product.description },
    {
      title: "Fabric & care",
      body: [product.fabric && `Fabric: ${product.fabric}.`, product.care].filter(Boolean).join(" "),
    },
    {
      title: "Shipping & returns",
      body: "Free shipping across India, dispatched within 48 hours and delivered in 4 to 7 working days. Returns and exchanges are accepted within 7 days of delivery on unworn pieces with tags intact.",
    },
  ];

  return (
    <>
      <div className="md:container-x md:pt-8">
        <div className="grid md:grid-cols-12 md:gap-10 lg:gap-16">
          <div className="md:col-span-7">
            <Gallery images={product.images} name={product.name} />
          </div>

          <div className="container-x pt-8 md:col-span-5 md:px-0 md:pt-0">
            <div className="md:sticky md:top-28">
              <nav aria-label="Breadcrumb" className="eyebrow flex flex-wrap items-center gap-2 text-stone">
                <Link href="/" className="hover:text-ink">Home</Link>
                <span aria-hidden>/</span>
                <Link href={`/shop/${product.category.slug}`} className="hover:text-ink">
                  {product.category.name}
                </Link>
              </nav>

              <h1 className="display mt-6 text-[2.5rem] md:text-[3.25rem]">{product.name}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone">
                {product.fabric && <span>{product.fabric}</span>}
                {product.occasion && (
                  <>
                    <span className="size-1 rounded-full bg-line" aria-hidden />
                    <span>{product.occasion}</span>
                  </>
                )}
                {product.isNewArrival && (
                  <>
                    <span className="size-1 rounded-full bg-line" aria-hidden />
                    <span className="text-clay">New arrival</span>
                  </>
                )}
              </div>

              <div className="mt-7 border-t border-line pt-7">
                <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
                <p className="mt-1.5 text-xs text-stone">Inclusive of all taxes</p>
              </div>

              <div className="mt-9">
                <PurchasePanel product={cardFromDetail(product)} variants={product.variants} />
              </div>

              <ul className="mt-9 grid gap-4 border-y border-line py-6 text-sm text-ink-soft sm:grid-cols-2">
                <li className="flex items-start gap-3">
                  <Truck className="mt-0.5 size-4 shrink-0 text-clay" strokeWidth={1.5} />
                  Free delivery in 4 to 7 days
                </li>
                <li className="flex items-start gap-3">
                  <RotateCcw className="mt-0.5 size-4 shrink-0 text-clay" strokeWidth={1.5} />
                  Easy 7-day returns
                </li>
              </ul>

              <div className="divide-y divide-line border-b border-line">
                {details.map((d, i) => (
                  <details key={d.title} open={i === 0} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between py-5">
                      <span className="eyebrow">{d.title}</span>
                      <Plus
                        className="size-4 transition-transform duration-300 group-open:rotate-45"
                        strokeWidth={1.5}
                      />
                    </summary>
                    <p className="pb-6 pr-8 text-sm leading-relaxed text-ink-soft">{d.body}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
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
    <div className="md:container-x md:pt-8" aria-busy>
      <div className="grid md:grid-cols-12 md:gap-16">
        <div className="aspect-[3/4] animate-pulse bg-sand md:col-span-7" />
        <div className="container-x space-y-5 pt-8 md:col-span-5 md:px-0 md:pt-0">
          <div className="h-3 w-32 animate-pulse bg-sand" />
          <div className="h-14 w-4/5 animate-pulse bg-sand" />
          <div className="h-6 w-28 animate-pulse bg-sand" />
          <div className="h-14 w-full animate-pulse bg-sand" />
        </div>
      </div>
    </div>
  );
}
