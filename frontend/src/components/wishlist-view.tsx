"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useHydrated, useWishlist } from "@/lib/wishlist";
import { ProductCard } from "./product-card";
import { ProductGridSkeleton } from "./skeletons";

export function WishlistView() {
  const { items } = useWishlist();
  const hydrated = useHydrated();

  return (
    <>
      <h1 className="display mt-8 text-[3.25rem] md:text-[5.5rem]">
        Wishlist {items.length > 0 && <span className="text-stone">({items.length})</span>}
      </h1>

      {!hydrated ? (
        <div className="mt-[4.75rem]" aria-busy>
          <ProductGridSkeleton count={4} />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-12 border-t border-line py-24 text-center">
          <p className="display text-3xl">Nothing saved yet</p>
          <p className="mt-3 text-sm text-stone">Tap the heart on any piece to keep it here for later.</p>
          <Link
            href="/shop"
            className="eyebrow group mt-10 inline-flex items-center gap-3 bg-ink px-7 py-4 text-canvas transition-colors hover:bg-clay-deep"
          >
            Browse the collection
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-4 max-w-md text-sm text-stone">
            Saved on this device. Prices and stock are confirmed on each piece&rsquo;s page.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-14 md:gap-x-6 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
