import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/http-error.js";

export const productsRouter = Router();

const boolParam = z
  .enum(["true", "false"])
  .transform((v) => v === "true")
  .optional();

const ListQuery = z.object({
  category: z.string().optional(),
  featured: boolParam,
  new: boolParam,
  color: z.string().optional(),
  fabric: z.string().optional(),
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

function toCard({ variants, ...p }: CardRow) {
  const colors = new Map<string, string>();
  for (const v of variants) colors.set(v.color, v.colorHex);
  return {
    ...p,
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

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(q.category && { category: { slug: q.category } }),
    ...(q.featured !== undefined && { isFeatured: q.featured }),
    ...(q.new !== undefined && { isNewArrival: q.new }),
    ...(q.fabric && { fabric: { equals: q.fabric, mode: "insensitive" } }),
    ...(q.color && { variants: { some: { color: { equals: q.color, mode: "insensitive" } } } }),
    ...((q.minPrice !== undefined || q.maxPrice !== undefined) && {
      price: { gte: q.minPrice, lte: q.maxPrice },
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
    items: rows.map(toCard),
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

  res.json({ ...product, related: related.map(toCard) });
});
