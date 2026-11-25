// What shoppers can see, shared by every storefront query.
import type { Prisma } from "../../generated/prisma/client.js";

/** A category the store shows: switched on, and (for a subcategory) its parent is on too. */
export const visibleCategory: Prisma.CategoryWhereInput = {
  isActive: true,
  OR: [{ parentId: null }, { parent: { isActive: true } }],
};

/** A product the store shows: switched on, in a visible category. */
export const visibleProduct: Prisma.ProductWhereInput = {
  isActive: true,
  category: visibleCategory,
};

/** Products in a category or any of its subcategories (by slug). */
export const inCategory = (slug: string): Prisma.ProductWhereInput => ({
  category: { OR: [{ slug }, { parent: { slug } }] },
});
