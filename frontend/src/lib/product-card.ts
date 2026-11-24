import type { ProductCard, ProductDetail } from "./types";

/** Card snapshot of a full product, for saving from the product page. */
export function cardFromDetail(p: ProductDetail): ProductCard {
  const colors = new Map<string, string>();
  for (const v of p.variants) colors.set(v.color, v.colorHex);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    fabric: p.fabric,
    isNewArrival: p.isNewArrival,
    category: p.category,
    images: p.images.slice(0, 2),
    colors: [...colors].map(([name, hex]) => ({ name, hex })),
    inStock: p.variants.some((v) => v.stock > 0),
  };
}
