import { z } from "zod";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { HttpError, notFound } from "../lib/http-error.js";

/** Comma-separated multi-select param → array */
const csv = z
  .string()
  .optional()
  .transform((s) => (s ? s.split(",").map((v) => v.trim()).filter(Boolean) : []));

export const ProductListQuery = z.object({
  status: csv.pipe(z.array(z.enum(["all", "active", "hidden"]))),
  category: csv.pipe(z.array(z.string().max(80))),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const VariantInput = z.object({
  id: z.string().optional(),
  sku: z.string().trim().min(2, "SKU is required").max(40),
  color: z.string().trim().min(1, "Colour is required").max(40),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #9E1B32"),
  // null / "" mean free size (e.g. sarees)
  size: z
    .string()
    .trim()
    .max(10)
    .nullish()
    .transform((v) => v || null),
  stock: z.number().int().min(0).max(9999),
});

// Must match images.remotePatterns in frontend/next.config.ts
const IMAGE_HOSTS = ["images.unsplash.com", "res.cloudinary.com"];

const ImageInput = z.object({
  url: z
    .url("Enter a valid image URL")
    .refine((u) => u.startsWith("https://"), "Image URL must start with https://")
    .refine((u) => IMAGE_HOSTS.includes(new URL(u).hostname), `Images must be hosted on ${IMAGE_HOSTS.join(" or ")}`),
  alt: z.string().trim().max(160).default(""),
});

export const ProductInput = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens")
      .optional(),
    description: z.string().trim().min(10, "Add a short description").max(4000),
    fabric: z.string().trim().max(60).optional(),
    occasion: z.string().trim().max(60).optional(),
    care: z.string().trim().max(500).optional(),
    categoryId: z.string().min(1, "Choose a category"),
    price: z.number().int().min(100, "Price must be at least ₹1"),
    compareAtPrice: z.number().int().nullable().optional(),
    isFeatured: z.boolean().default(false),
    isNewArrival: z.boolean().default(false),
    isActive: z.boolean().default(true),
    images: z.array(ImageInput).max(12),
    variants: z.array(VariantInput).min(1, "Add at least one variant"),
  })
  .refine((p) => !p.compareAtPrice || p.compareAtPrice > p.price, {
    path: ["compareAtPrice"],
    message: "Compare-at price must be higher than the price",
  })
  .refine((p) => new Set(p.variants.map((v) => v.sku.toUpperCase())).size === p.variants.length, {
    path: ["variants"],
    message: "Each variant needs a unique SKU",
  });


const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = base;
  for (let i = 2; await prisma.product.findFirst({ where: { slug, id: { not: excludeId } } }); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
}

async function assertSkusFree(skus: string[], productId?: string) {
  const clash = await prisma.productVariant.findFirst({
    where: { sku: { in: skus, mode: "insensitive" }, productId: { not: productId } },
    select: { sku: true },
  });
  if (clash) throw new HttpError(409, `SKU ${clash.sku} is already used by another product.`);
}

export async function listProducts(q: z.infer<typeof ProductListQuery>) {
  const where: Prisma.ProductWhereInput = {
    // Only one of live/hidden selected narrows the list; both (or neither) means everything
    ...(q.status.includes("active") !== q.status.includes("hidden") && { isActive: q.status.includes("active") }),
    ...(q.category.length > 0 && { category: { slug: { in: q.category } } }),
    ...(q.search && {
      OR: [
        { name: { contains: q.search, mode: "insensitive" } },
        { variants: { some: { sku: { contains: q.search, mode: "insensitive" } } } },
      ],
    }),
  };

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      include: {
        category: { select: { name: true } },
        images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
        variants: { select: { stock: true } },
      },
    }),
  ]);

  return {
    items: rows.map(({ variants, images, ...p }) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category.name,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      image: images[0]?.url ?? null,
      variantCount: variants.length,
      totalStock: variants.reduce((n, v) => n + v.stock, 0),
      lowStock: variants.some((v) => v.stock <= 3),
      updatedAt: p.updatedAt,
    })),
    total,
    page: q.page,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}

export async function getAdminProduct(id: string) {
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" }, select: { url: true, alt: true } },
      variants: { orderBy: { sku: "asc" } },
    },
  });
  if (!p) throw notFound("Product");
  return p;
}

export async function createProduct(input: z.infer<typeof ProductInput>) {
  await assertSkusFree(input.variants.map((v) => v.sku));
  const slug = await uniqueSlug(input.slug || slugify(input.name));
  const { images, variants, ...fields } = input;

  const p = await prisma.product.create({
    data: {
      ...fields,
      slug,
      images: { create: images.map((img, position) => ({ ...img, alt: img.alt || `${input.name}, view ${position + 1}`, position })) },
      variants: { create: variants.map(({ id: _id, ...v }) => ({ ...v, sku: v.sku.toUpperCase() })) },
    },
  });
  return getAdminProduct(p.id);
}

export async function updateProduct(id: string, input: z.infer<typeof ProductInput>) {
  const existing = await prisma.product.findUnique({ where: { id }, include: { variants: { select: { id: true } } } });
  if (!existing) throw notFound("Product");
  await assertSkusFree(input.variants.map((v) => v.sku), id);

  const slug = await uniqueSlug(input.slug || slugify(input.name), id);
  const { images, variants, ...fields } = input;
  const keepIds = new Set(variants.flatMap((v) => (v.id ? [v.id] : [])));

  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data: { ...fields, slug } });

    // Images: replace in the given order
    await tx.productImage.deleteMany({ where: { productId: id } });
    await tx.productImage.createMany({
      data: images.map((img, position) => ({ productId: id, url: img.url, alt: img.alt || `${input.name}, view ${position + 1}`, position })),
    });

    // Variants: delete removed, update kept, create new (order history keeps its snapshots)
    await tx.productVariant.deleteMany({ where: { productId: id, id: { notIn: [...keepIds] } } });
    for (const { id: variantId, ...v } of variants) {
      const data = { ...v, sku: v.sku.toUpperCase() };
      if (variantId && existing.variants.some((ev) => ev.id === variantId)) {
        await tx.productVariant.update({ where: { id: variantId }, data });
      } else {
        await tx.productVariant.create({ data: { ...data, productId: id } });
      }
    }
  });

  return getAdminProduct(id);
}

export async function setProductActive(id: string, isActive: boolean) {
  const p = await prisma.product.update({ where: { id }, data: { isActive } }).catch(() => null);
  if (!p) throw notFound("Product");
  return { id: p.id, isActive: p.isActive };
}
