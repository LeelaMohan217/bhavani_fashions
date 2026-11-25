"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import type { ProductCard } from "@/lib/types";
import { useFeedback } from "@/components/ui/feedback";

/** Save or unsave a piece, with a toast: "View" after saving, "Undo" after removing. */
function useWishlistToggle(product: ProductCard) {
  const { has, toggle } = useWishlist();
  const { toast } = useFeedback();
  const router = useRouter();
  const saved = has(product.id);
  // Pop the heart only when the shopper taps it, not when saved hearts appear on page load
  const [tapped, setTapped] = useState(false);
  const onToggle = () => {
    setTapped(true);
    toggle(product);
    if (saved) toast("Removed from wishlist", { action: { label: "Undo", onClick: () => toggle(product) } });
    else toast("Saved to wishlist", { action: { label: "View", onClick: () => router.push("/wishlist") } });
  };
  return { saved, onToggle, pop: saved && tapped ? "animate-pop" : "" };
}

export function WishlistButton({
  product,
  className = "",
  revealOnHover = false,
}: {
  product: ProductCard;
  className?: string;
  /**
   * Product cards on desktop: an unsaved heart appears only while the card is hovered (or the
   * heart is focused), but a saved heart always shows, so shoppers can see what they've saved.
   */
  revealOnHover?: boolean;
}) {
  const { saved, onToggle, pop } = useWishlistToggle(product);
  const reveal = revealOnHover && !saved ? "md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100" : "";

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      onClick={onToggle}
      className={`inline-flex size-9 items-center justify-center rounded-full bg-canvas/85 text-ink backdrop-blur transition hover:bg-canvas ${reveal} ${className}`}
    >
      <Heart
        key={String(saved)}
        className={`size-4 ${saved ? `fill-clay text-clay ${pop}` : ""}`}
        strokeWidth={1.5}
      />
    </button>
  );
}

/** Product page: "Add to wishlist" text link with a heart, switching to "Saved to wishlist". */
export function WishlistTextButton({ product, className = "" }: { product: ProductCard; className?: string }) {
  const { saved, onToggle, pop } = useWishlistToggle(product);
  return (
    <button type="button" aria-pressed={saved} onClick={onToggle} className={`inline-flex items-center gap-2 ${className}`}>
      <Heart key={String(saved)} className={`size-3.5 ${saved ? `fill-clay text-clay ${pop}` : ""}`} strokeWidth={1.5} />
      {saved ? "Saved to wishlist" : "Add to wishlist"}
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
