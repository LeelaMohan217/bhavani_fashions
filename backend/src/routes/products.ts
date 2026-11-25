import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/http-error.js";
import { getActivePromotion, withPromotion, type ActivePromotion } from "../services/promotions.js";

export const productsRouter = Router();

const boolParam = z
  .enum(["true", "false"])
  .transform((v) => v === "true")
  .optional();

/** Comma-separated list, e.g. "Rose,Plum" → ["Rose", "Plum"] (a single value works too) */
const csv = z
  .string()
  .max(400)
  .optional()
  .transform((s) => (s ? [...new Set(s.split(",").map((v) => v.trim()).filter(Boolean))].slice(0, 20) : []));

/** Price bands in paise, "min-max" with either end optional: "-300000,300000-500000,2000000-" */
const priceBands = csv.pipe(
  z.array(
    z
      .string()
      .regex(/^\d{0,9}-\d{0,9}$/, "Price bands look like 300000-500000")
      .transform((b) => {
        const [lo, hi] = b.split("-");
        return { min: lo ? Number(lo) : undefined, max: hi ? Number(hi) : undefined };
      }),
  ),
);

const ListQuery = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().optional(),
  featured: boolParam,
  new: boolParam,
  /** Only products marked down (compare-at price above the price) */
  sale: boolParam,
  // Multi-select filters: a product matches if it matches any value within a filter
  color: csv,
  fabric: csv,
  occasion: csv,
  price: priceBands,
  // Single price range (older links); combined with `price` bands if both are given
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "featured"]).default("featured"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

// Fields needed to render a product card (two images for the hover swap)
const cardSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  fabric: true,
  isNewArrival: true,
  category: { select: { name: true, slug: true } },
  images: { orderBy: { position: "asc" }, take: 2, select: { url: true, alt: true } },
  variants: { orderBy: { sku: "asc" }, select: { id: true, color: true, colorHex: true, size: true, stock: true } },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

function toCard({ variants, ...p }: CardRow, promo: ActivePromotion | null, sold: Map<string, number>) {
  const colors = new Map<string, string>();
  for (const v of variants) colors.set(v.color, v.colorHex);
  return {
    ...withPromotion(p, promo),
    colors: [...colors].map(([name, hex]) => ({ name, hex })),
    inStock: variants.some((v) => v.stock > 0),
    sold: sold.get(p.id) ?? 0,
    // What can be bought from the card itself (quick add): colour, size and stock per option
    options: variants.map((v) => ({ id: v.id, color: v.color, colorHex: v.colorHex, size: v.size, stock: v.stock })),
  };
}

/** Orders that really went through (not unpaid or cancelled) */
const COUNTED_STATUSES = ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;

/** Pieces sold per product, from real orders. One grouped query for a whole page of cards. */
async function soldCounts(rows: { variants: { id: string }[]; id: string }[]) {
  const productOf = new Map<string, string>();
  for (const r of rows) for (const v of r.variants) productOf.set(v.id, r.id);
  const sold = new Map<string, number>();
  if (productOf.size === 0) return sold;

  const groups = await prisma.orderItem.groupBy({
    by: ["variantId"],
    where: { variantId: { in: [...productOf.keys()] }, order: { status: { in: [...COUNTED_STATUSES] } } },
    _sum: { quantity: true },
  });
  for (const g of groups) {
    const productId = g.variantId ? productOf.get(g.variantId) : undefined;
    if (productId) sold.set(productId, (sold.get(productId) ?? 0) + (g._sum.quantity ?? 0));
  }
  return sold;
}

const orderByFor: Record<z.infer<typeof ListQuery>["sort"], Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }],
  "price-asc": [{ price: "asc" }],
  "price-desc": [{ price: "desc" }],
  featured: [{ isFeatured: "desc" }, { createdAt: "desc" }],
};

/** The products a listing starts from (category, new, sale), before the sidebar filters */
function scopeWhere(q: { category?: string; new?: boolean; sale?: boolean }, promo: ActivePromotion | null): Prisma.ProductWhereInput {
  return {
    isActive: true,
    ...(q.category && { category: { slug: q.category } }),
    ...(q.new !== undefined && { isNewArrival: q.new }),
    // During a store-wide promotion every piece is on sale
    ...(q.sale && !promo && { compareAtPrice: { gt: prisma.product.fields.price } }),
  };
}

/** Price bounds are what shoppers see, so during a promotion they're converted back to list prices */
function priceRange(min: number | undefined, max: number | undefined, promo: ActivePromotion | null) {
  const toList = (v: number, round: (n: number) => number) => (promo ? round((v * 100) / (100 - promo.percentOff)) : v);
  return {
    gte: min === undefined ? undefined : toList(min, Math.ceil),
    // Band tops are exclusive (₹3,000 – ₹5,000 doesn't include ₹5,000)
    lt: max === undefined ? undefined : toList(max, Math.ceil),
  };
}

// GET /api/products — filterable, sortable, paginated product list
productsRouter.get("/", async (req, res) => {
  const q = ListQuery.parse(req.query);
  const promo = await getActivePromotion();

  const and: Prisma.ProductWhereInput[] = [];
  // Search: every word must match the name, fabric, occasion, category or a colour
  if (q.q) {
    for (const word of q.q.split(/\s+/)) {
      and.push({
        OR: [
          { name: { contains: word, mode: "insensitive" } },
          { fabric: { contains: word, mode: "insensitive" } },
          { occasion: { contains: word, mode: "insensitive" } },
          { category: { name: { contains: word, mode: "insensitive" } } },
          { variants: { some: { color: { contains: word, mode: "insensitive" } } } },
        ],
      });
    }
  }
  if (q.price.length > 0) and.push({ OR: q.price.map((b) => ({ price: priceRange(b.min, b.max, promo) })) });
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    // Older single-range links: maxPrice is inclusive
    and.push({ price: priceRange(q.minPrice, q.maxPrice === undefined ? undefined : q.maxPrice + 1, promo) });
  }

  const where: Prisma.ProductWhereInput = {
    ...scopeWhere(q, promo),
    ...(q.featured !== undefined && { isFeatured: q.featured }),
    ...(q.fabric.length > 0 && { fabric: { in: q.fabric, mode: "insensitive" } }),
    ...(q.occasion.length > 0 && { occasion: { in: q.occasion, mode: "insensitive" } }),
    ...(q.color.length > 0 && { variants: { some: { color: { in: q.color, mode: "insensitive" } } } }),
    ...(and.length > 0 && { AND: and }),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: orderByFor[q.sort],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      select: cardSelect,
    }),
  ]);

  const sold = await soldCounts(rows);
  res.json({
    items: rows.map((r) => toCard(r, promo, sold)),
    total,
    page: q.page,
    pageSize: q.pageSize,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  });
});

const FiltersQuery = z.object({ category: z.string().optional(), new: boolParam, sale: boolParam });

// GET /api/products/filters — the colours, fabrics and occasions on offer in a listing, with counts,
// so the shop sidebar only offers choices that will find something. Declared before /:slug.
productsRouter.get("/filters", async (req, res) => {
  const q = FiltersQuery.parse(req.query);
  const promo = await getActivePromotion();
  const rows = await prisma.product.findMany({
    where: scopeWhere(q, promo),
    select: { fabric: true, occasion: true, variants: { select: { color: true, colorHex: true } } },
  });

  // Group case-insensitively, keep the first spelling seen, count products (not variants)
  const tally = <T extends { name: string }>(map: Map<string, T & { count: number }>, item: T) => {
    const key = item.name.trim().toLowerCase();
    if (!key) return;
    const hit = map.get(key);
    if (hit) hit.count++;
    else map.set(key, { ...item, name: item.name.trim(), count: 1 });
  };
  const fabrics = new Map<string, { name: string; count: number }>();
  const occasions = new Map<string, { name: string; count: number }>();
  const colors = new Map<string, { name: string; hex: string; count: number }>();

  for (const p of rows) {
    if (p.fabric) tally(fabrics, { name: p.fabric });
    if (p.occasion) tally(occasions, { name: p.occasion });
    const seen = new Set<string>();
    for (const v of p.variants) {
      const key = v.color.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      tally(colors, { name: v.color, hex: v.colorHex });
    }
  }

  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  res.json({
    colors: [...colors.values()].sort(byName),
    fabrics: [...fabrics.values()].sort(byName),
    occasions: [...occasions.values()].sort(byName),
  });
});

// GET /api/products/:slug — full product detail plus related products
productsRouter.get("/:slug", async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { slug: req.params.slug, isActive: true },
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: { position: "asc" }, select: { url: true, alt: true } },
      variants: {
        orderBy: { sku: "asc" },
        select: { id: true, sku: true, color: true, colorHex: true, size: true, stock: true },
      },
    },
  });

  if (!product) throw notFound("Product");

  const related = await prisma.product.findMany({
    where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 4,
    select: cardSelect,
  });

  const [promo, sold] = await Promise.all([getActivePromotion(), soldCounts([...related, product])]);
  res.json({
    ...withPromotion(product, promo),
    sold: sold.get(product.id) ?? 0,
    related: related.map((r) => toCard(r, promo, sold)),
  });
});
