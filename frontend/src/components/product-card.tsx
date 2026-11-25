import Image from "next/image";
import Link from "next/link";
import type { ProductCard as ProductCardType } from "@/lib/types";
import { discountPercent } from "@/lib/format";
import { Price } from "./price";
import { WishlistButton } from "./wishlist-button";
import { Plus, ShoppingBag } from "lucide-react";
import { QuickAdd } from "./quick-add";

/** Swatches shown on a card; more colours show a + that opens the product page */
const MAX_SWATCHES = 3;
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

/** "10+ bought" … "1k+ bought"; nothing under 10 sales so new pieces don't say "1 bought" */
export function boughtLabel(sold = 0) {
  const steps = [1000, 500, 100, 50, 10];
  const step = steps.find((s) => sold >= s);
  if (!step) return null;
  return `${step >= 1000 ? `${step / 1000}k` : step}+ bought`;
}

export function ProductCard({
  product,
  priority = false,
  sizes = "(min-width: 1024px) 25vw, 50vw",
}: {
  product: ProductCardType;
  priority?: boolean;
  sizes?: string;
}) {
  const [primary, secondary] = product.images;
  const off = discountPercent(product.price, product.compareAtPrice);
  // Sizes still in stock, smallest first; null for free-size pieces (and older snapshots without options)
  const inStockSizes = [...new Set((product.options ?? []).filter((o) => o.size && o.stock > 0).map((o) => o.size!))].sort(
    (a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b),
  );
  const sizeList = inStockSizes.length > 0 ? inStockSizes : null;

  return (
    // Column layout so the Add to bag buttons line up at the bottom of each row of cards
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[3/4] overflow-hidden bg-sand">
        <Link href={`/products/${product.slug}`} aria-label={product.name} className="absolute inset-0">
          {primary && (
            <Image
              src={primary.url}
              alt={primary.alt}
              fill
              sizes={sizes}
              priority={priority}
              className={`object-cover transition duration-[1.2s] ease-[var(--ease-editorial)] group-hover:scale-[1.03] ${
                secondary ? "group-hover:opacity-0" : ""
              }`}
            />
          )}
          {secondary && (
            <Image
              src={secondary.url}
              alt=""
              fill
              sizes={sizes}
              className="scale-[1.03] object-cover opacity-0 transition duration-[1.2s] ease-[var(--ease-editorial)] group-hover:scale-100 group-hover:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.isNewArrival && (
            <span className="eyebrow bg-canvas px-2 py-1 text-[0.58rem] text-ink">New</span>
          )}
          {off &&
            (product.onPromotion ? (
              <span className="eyebrow bg-night px-2 py-1 text-[0.58rem] text-gold">−{off}%</span>
            ) : (
              <span className="eyebrow bg-clay px-2 py-1 text-[0.58rem] text-canvas">−{off}%</span>
            ))}
        </div>

        <WishlistButton
          product={product}
          revealOnHover
          className="absolute right-3 top-3"
        />

        {!product.inStock && (
          <span className="eyebrow absolute inset-x-0 bottom-0 bg-ink/80 py-2 text-center text-[0.6rem] text-canvas">
            Sold out
          </span>
        )}
      </div>

      {/* Name (2 lines at most), price, how many bought, then sizes (left) and colours (right) */}
      <div className="mt-3.5 space-y-1.5">
        <h3 className="line-clamp-2 font-display text-[1.05rem] leading-snug tracking-[-0.01em] md:text-lg" title={product.name}>
          <Link href={`/products/${product.slug}`} className="link-draw">
            {product.name}
          </Link>
        </h3>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} />
        {boughtLabel(product.sold) && (
          <p className="flex items-center gap-1.5 text-xs text-stone">
            <ShoppingBag className="size-3.5" strokeWidth={1.5} aria-hidden />
            {boughtLabel(product.sold)}
          </p>
        )}
      </div>

      <div className="mt-2.5 flex min-h-5 items-center justify-between gap-3">
        {product.options ? (
          sizeList ? (
            <p className="flex min-w-0 gap-2 overflow-hidden text-[0.7rem] tracking-wide text-stone">
              <span className="sr-only">Sizes</span>
              {sizeList.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </p>
          ) : (
            <p className="text-[0.7rem] tracking-wide text-stone">Free size</p>
          )
        ) : (
          <span />
        )}
        {product.colors.length > 0 && (
          <ul className="flex shrink-0 items-center gap-1.5" aria-label={`${product.colors.length} ${product.colors.length === 1 ? "colour" : "colours"}`}>
            {product.colors.slice(0, MAX_SWATCHES).map((c) => (
              <li
                key={c.name}
                title={c.name}
                className="size-3.5 rounded-full shadow-[inset_0_0_0_1px_rgb(17_17_17/0.18)]"
                style={{ backgroundColor: c.hex }}
              >
                <span className="sr-only">{c.name}</span>
              </li>
            ))}
            {product.colors.length > MAX_SWATCHES && (
              <li>
                <Link
                  href={`/products/${product.slug}`}
                  aria-label={`See all ${product.colors.length} colours`}
                  title={`${product.colors.length - MAX_SWATCHES} more`}
                  className="flex size-4 items-center justify-center rounded-full border border-stone/50 text-stone transition-colors hover:border-ink hover:text-ink"
                >
                  <Plus className="size-2.5" strokeWidth={2} />
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="mt-auto pt-3">
        <QuickAdd product={product} />
      </div>
    </article>
  );
}
