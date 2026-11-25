import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/http-error.js";
import { inCategory, visibleCategory, visibleProduct } from "../lib/catalogue.js";

export const categoriesRouter = Router();

/** Visible products in a category, counting its subcategories too */
const countFor = (slug: string) => prisma.product.count({ where: { AND: [visibleProduct, inCategory(slug)] } });

// GET /api/categories — visible top-level categories in the admin's order, with product counts
categoriesRouter.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, tagline: true, description: true, imageUrl: true, sortOrder: true },
  });
  const counts = await Promise.all(categories.map((c) => countFor(c.slug)));
  res.json(categories.map((c, i) => ({ ...c, productCount: counts[i] })));
});

// GET /api/categories/:slug — one visible category (or subcategory)
categoriesRouter.get("/:slug", async (req, res) => {
  const category = await prisma.category.findFirst({
    where: { slug: req.params.slug, ...visibleCategory },
    select: { id: true, name: true, slug: true, tagline: true, description: true, imageUrl: true, sortOrder: true },
  });
  if (!category) throw notFound("Category");
  res.json({ ...category, productCount: await countFor(category.slug) });
});
