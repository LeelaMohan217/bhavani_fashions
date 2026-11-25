"use client";

import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { useHydrated, useWishlist } from "@/lib/wishlist";
import { ProductCard } from "./product-card";
import { ProductGridSkeleton } from "./skeletons";

/** Minimal wishlist: slim title row, the saved pieces, or a short empty state. */
export function WishlistView() {
  const { items } = useWishlist();
  const hydrated = useHydrated();
  const count = hydrated ? items.length : 0;

  return (
    <>
      <div className="mt-3 flex items-end justify-between gap-4 border-b border-line pb-4">
        <h1 className="display text-[2.25rem] leading-none md:text-[2.75rem]">
          Wishlist
          {count > 0 && (
            <span className="ml-3 align-middle font-sans text-sm tracking-normal text-stone tabular-nums">
              {count} {count === 1 ? "piece" : "pieces"}
            </span>
          )}
        </h1>
        {count > 0 && <p className="hidden text-xs text-stone sm:block">Saved on this device</p>}
      </div>

      {!hydrated ? (
        <div className="mt-8" aria-busy>
          <ProductGridSkeleton count={4} />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center md:py-28">
          <span className="flex size-12 items-center justify-center rounded-full bg-sand">
            <Heart className="size-5 text-stone" strokeWidth={1.5} />
          </span>
          <p className="mt-5 text-base text-ink">Nothing saved yet</p>
          <p className="mt-1 text-sm text-stone">Tap the heart on any piece to keep it here.</p>
          <Link href="/shop" className="group mt-6 inline-flex items-center gap-2 text-sm text-ink underline-offset-4 hover:underline">
            Browse the collection
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
          ))}
        </div>
      )}
    </>
  );
}
