import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/http-error.js";

export const categoriesRouter = Router();

// GET /api/categories — all categories with their active product count
categoriesRouter.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });

  res.json(
    categories.map(({ _count, ...c }) => ({ ...c, productCount: _count.products })),
  );
});

// GET /api/categories/:slug
categoriesRouter.get("/:slug", async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });

  if (!category) throw notFound("Category");

  const { _count, ...rest } = category;
  res.json({ ...rest, productCount: _count.products });
});
