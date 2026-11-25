// Admin → Categories: categories and their subcategories (one level deep).
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError, notFound } from "../lib/http-error.js";

// Must match images.remotePatterns in frontend/next.config.ts
const IMAGE_HOSTS = ["images.unsplash.com", "res.cloudinary.com"];
/** A photo shipped with the storefront in public/banners */
const STORE_PHOTO = /^\/banners\/[a-z0-9-]+\.(?:jpe?g|png)$/i;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

export const CategoryInput = z.object({
  name: z.string().trim().min(2, "Add a name").max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens")
    .max(60)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  tagline: optionalText(80),
  description: optionalText(400),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((v) => v || null)
    .refine(
      (u) => {
        if (!u) return true;
        if (STORE_PHOTO.test(u)) return true;
        try {
          const url = new URL(u);
          return url.protocol === "https:" && IMAGE_HOSTS.includes(url.hostname);
        } catch {
          return false;
        }
      },
      `Use a store photo like /banners/navy-silk-saree.jpg, or a link from ${IMAGE_HOSTS.join(" or ")}`,
    ),
  /** Set to make this a subcategory of a top-level category */
  parentId: z
    .string()
    .nullish()
    .transform((v) => v || null),
  isActive: z.boolean().default(true),
});

export const CategoryOrder = z.object({ ids: z.array(z.string().min(1)).min(1).max(100) });

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = base || "category";
  for (let i = 2; await prisma.category.findFirst({ where: { slug, id: { not: excludeId } } }); i++) slug = `${base}-${i}`;
  return slug;
}

/** Every category, parents in order with their subcategories right after them */
export async function listAdminCategories() {
  const all = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { products: true, children: true } } },
  });
  const shaped = all.map(({ _count, ...c }) => ({ ...c, productCount: _count.products, childCount: _count.children }));
  const ordered: typeof shaped = [];
  for (const parent of shaped.filter((c) => !c.parentId)) {
    ordered.push(parent, ...shaped.filter((c) => c.parentId === parent.id));
  }
  return ordered;
}

export async function getAdminCategory(id: string) {
  const c = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true, children: true } }, parent: { select: { id: true, name: true } } },
  });
  if (!c) throw notFound("Category");
  const { _count, ...rest } = c;
  return { ...rest, productCount: _count.products, childCount: _count.children };
}

/** A parent must exist, be top-level, and not be the category itself (one level deep only) */
async function checkParent(parentId: string | null, selfId?: string) {
  if (!parentId) return;
  if (parentId === selfId) throw new HttpError(400, "A category can't be inside itself.");
  const parent = await prisma.category.findUnique({ where: { id: parentId }, select: { parentId: true } });
  if (!parent) throw new HttpError(400, "That parent category no longer exists.");
  if (parent.parentId) throw new HttpError(400, "Subcategories can't have their own subcategories.");
  if (selfId && (await prisma.category.count({ where: { parentId: selfId } })) > 0) {
    throw new HttpError(400, "This category has subcategories, so it can't move inside another category.");
  }
}

export async function createCategory(input: z.infer<typeof CategoryInput>) {
  await checkParent(input.parentId);
  const slug = await uniqueSlug(input.slug || slugify(input.name));
  // New categories go to the end of their list
  const last = await prisma.category.aggregate({ where: { parentId: input.parentId }, _max: { sortOrder: true } });
  const c = await prisma.category.create({ data: { ...input, slug, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
  return getAdminCategory(c.id);
}

export async function updateCategory(id: string, input: z.infer<typeof CategoryInput>) {
  const existing = await prisma.category.findUnique({ where: { id }, select: { parentId: true } });
  if (!existing) throw notFound("Category");
  await checkParent(input.parentId, id);
  const slug = await uniqueSlug(input.slug || slugify(input.name), id);
  // Moving to another parent puts it at the end of that list
  const moved = existing.parentId !== input.parentId;
  const sortOrder = moved
    ? ((await prisma.category.aggregate({ where: { parentId: input.parentId }, _max: { sortOrder: true } }))._max.sortOrder ?? -1) + 1
    : undefined;
  await prisma.category.update({ where: { id }, data: { ...input, slug, ...(sortOrder !== undefined && { sortOrder }) } });
  return getAdminCategory(id);
}

export async function setCategoryActive(id: string, isActive: boolean) {
  await getAdminCategory(id);
  await prisma.category.update({ where: { id }, data: { isActive } });
  return getAdminCategory(id);
}

/** Only empty categories can be deleted, so no product is ever left without one */
export async function deleteCategory(id: string) {
  const c = await getAdminCategory(id);
  if (c.childCount > 0) {
    throw new HttpError(409, `Move or delete its ${c.childCount} subcategor${c.childCount === 1 ? "y" : "ies"} first.`);
  }
  if (c.productCount > 0) {
    throw new HttpError(409, `Move its ${c.productCount} product${c.productCount === 1 ? "" : "s"} to another category first, or hide it instead.`);
  }
  await prisma.category.delete({ where: { id } });
}

/** Saves the order of one list of siblings (top-level, or the subcategories of one parent) */
export async function reorderCategories(ids: string[]) {
  const rows = await prisma.category.findMany({ where: { id: { in: ids } }, select: { parentId: true } });
  if (rows.length !== ids.length) throw new HttpError(400, "Some categories no longer exist. Refresh and try again.");
  if (new Set(rows.map((r) => r.parentId)).size > 1) throw new HttpError(400, "Only categories in the same list can be reordered together.");
  await prisma.$transaction(ids.map((id, i) => prisma.category.update({ where: { id }, data: { sortOrder: i } })));
  return listAdminCategories();
}
