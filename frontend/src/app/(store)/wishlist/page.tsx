import type { Metadata } from "next";
import Link from "next/link";
import { WishlistView } from "@/components/wishlist-view";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function WishlistPage() {
  return (
    <div className="container-x pb-24 pt-6 md:pb-32 md:pt-8">
      <nav aria-label="Breadcrumb" className="eyebrow flex items-center gap-2 text-[0.625rem] text-stone">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span aria-hidden>/</span>
        <span className="text-ink">Wishlist</span>
      </nav>
      <WishlistView />
    </div>
  );
}
