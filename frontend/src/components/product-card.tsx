import Image from "next/image";
import Link from "next/link";
import type { ProductCard as ProductCardType } from "@/lib/types";
import { discountPercent } from "@/lib/format";
import { Price } from "./price";
import { WishlistButton } from "./wishlist-button";

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

  return (
    <article className="group relative">
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
          {off && <span className="eyebrow bg-clay px-2 py-1 text-[0.58rem] text-canvas">−{off}%</span>}
        </div>

        <WishlistButton
          product={product}
          className="absolute right-3 top-3 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
        />

        {!product.inStock && (
          <span className="eyebrow absolute inset-x-0 bottom-0 bg-ink/80 py-2 text-center text-[0.6rem] text-canvas">
            Sold out
          </span>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-[1.05rem] leading-snug tracking-[-0.01em] md:text-lg">
            <Link href={`/products/${product.slug}`} className="link-draw">
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 text-xs text-stone">{product.fabric}</p>
        </div>
        {product.colors.length > 0 && (
          <ul className="mt-1.5 flex shrink-0 -space-x-1" aria-label="Available colours">
            {product.colors.map((c) => (
              <li
                key={c.name}
                title={c.name}
                className="size-3 rounded-full shadow-[inset_0_0_0_1px_rgb(17_17_17/0.18)] ring-2 ring-canvas"
                style={{ backgroundColor: c.hex }}
              >
                <span className="sr-only">{c.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-2">
        <Price price={product.price} compareAtPrice={product.compareAtPrice} />
      </div>
    </article>
  );
}
