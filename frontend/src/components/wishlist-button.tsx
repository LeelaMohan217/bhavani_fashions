"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import type { ProductCard } from "@/lib/types";

export function WishlistButton({ product, className = "" }: { product: ProductCard; className?: string }) {
  const { has, toggle } = useWishlist();
  const saved = has(product.id);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      onClick={() => toggle(product)}
      className={`inline-flex size-9 items-center justify-center rounded-full bg-canvas/85 text-ink backdrop-blur transition hover:bg-canvas ${className}`}
    >
      <Heart
        className={`size-4 transition-transform duration-300 ${saved ? "scale-110 fill-clay text-clay" : ""}`}
        strokeWidth={1.5}
      />
    </button>
  );
}

/** Header heart: links to the wishlist page with a count badge. */
export function WishlistLink({ className = "" }: { className?: string }) {
  const { items } = useWishlist();
  return (
    <Link href="/wishlist" aria-label={`Wishlist, ${items.length} saved`} className={`relative ${className}`}>
      <Heart className="size-[1.15rem]" strokeWidth={1.5} />
      {items.length > 0 && (
        <span
          key={items.length}
          className="absolute right-0.5 top-0.5 flex h-4 min-w-4 animate-fade-in items-center justify-center rounded-full bg-clay px-1 text-[0.6rem] font-medium tabular-nums text-canvas"
        >
          {items.length}
        </span>
      )}
    </Link>
  );
}
