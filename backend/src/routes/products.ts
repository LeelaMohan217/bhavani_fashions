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

const ListQuery = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().optional(),
  featured: boolParam,
  new: boolParam,
  /** Only products marked down (compare-at price above the price) */
  sale: boolParam,
  color: z.string().optional(),
  fabric: z.string().optional(),
  occasion: z.string().trim().max(40).optional(),
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
  variants: { select: { color: true, colorHex: true, stock: true } },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

function toCard({ variants, ...p }: CardRow, promo: ActivePromotion | null) {
  const colors = new Map<string, string>();
  for (const v of variants) colors.set(v.color, v.colorHex);
  return {
    ...withPromotion(p, promo),
    colors: [...colors].map(([name, hex]) => ({ name, hex })),
    inStock: variants.some((v) => v.stock > 0),
  };
}

const orderByFor: Record<z.infer<typeof ListQuery>["sort"], Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }],
  "price-asc": [{ price: "asc" }],
  "price-desc": [{ price: "desc" }],
  featured: [{ isFeatured: "desc" }, { createdAt: "desc" }],
};

// GET /api/products — filterable, sortable, paginated product list
productsRouter.get("/", async (req, res) => {
  const q = ListQuery.parse(req.query);
  const promo = await getActivePromotion();

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    // Search: every word must match the name, fabric, occasion, category or a colour
    ...(q.q && {
      AND: q.q.split(/\s+/).map((word) => ({
        OR: [
          { name: { contains: word, mode: "insensitive" } },
          { fabric: { contains: word, mode: "insensitive" } },
          { occasion: { contains: word, mode: "insensitive" } },
          { category: { name: { contains: word, mode: "insensitive" } } },
          { variants: { some: { color: { contains: word, mode: "insensitive" } } } },
        ],
      })) satisfies Prisma.ProductWhereInput[],
    }),
    ...(q.category && { category: { slug: q.category } }),
    ...(q.featured !== undefined && { isFeatured: q.featured }),
    ...(q.new !== undefined && { isNewArrival: q.new }),
    // During a store-wide promotion every piece is on sale
    ...(q.sale && !promo && { compareAtPrice: { gt: prisma.product.fields.price } }),
    ...(q.fabric && { fabric: { equals: q.fabric, mode: "insensitive" } }),
    ...(q.occasion && { occasion: { equals: q.occasion, mode: "insensitive" } }),
    ...(q.color && { variants: { some: { color: { equals: q.color, mode: "insensitive" } } } }),
    // Price bounds are what shoppers see, so during a promotion they're converted back to list prices
    ...((q.minPrice !== undefined || q.maxPrice !== undefined) && {
      price: {
        gte: q.minPrice === undefined ? undefined : promo ? Math.ceil((q.minPrice * 100) / (100 - promo.percentOff)) : q.minPrice,
        lte: q.maxPrice === undefined ? undefined : promo ? Math.floor((q.maxPrice * 100) / (100 - promo.percentOff)) : q.maxPrice,
      },
    }),
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

  res.json({
    items: rows.map((r) => toCard(r, promo)),
    total,
    page: q.page,
    pageSize: q.pageSize,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
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

  const promo = await getActivePromotion();
  res.json({ ...withPromotion(product, promo), related: related.map((r) => toCard(r, promo)) });
});
