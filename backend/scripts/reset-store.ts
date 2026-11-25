// Clears the catalogue and all order history so the store can be filled from the admin.
// Deletes: products (photos, colours/sizes, stock), categories, orders (and their items and history),
// shopping bags, the activity log and the custom header/footer menus (they link to categories, so the
// menus go back to following the categories automatically). Coupon usage counts go back to 0.
// Order numbers restart at BF10001.
// Keeps: admin accounts, coupons, banners and the store-wide offer.
//
// Usage: npm run store:reset -- --yes
// It uses DATABASE_URL, so check which database that points at before running.
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

const url = process.env.DATABASE_URL ?? "";
let target = "(DATABASE_URL not set)";
try {
  const u = new URL(url);
  target = `${u.hostname}${u.pathname}`; // host and database name only, never the password
} catch {
  /* shown as not set */
}

const count = async () => ({
  categories: await prisma.category.count(),
  products: await prisma.product.count(),
  orders: await prisma.order.count(),
  carts: await prisma.cart.count(),
  activity: await prisma.activityLog.count(),
});

console.log(`Database: ${target}`);
console.log("Now:", await count());

if (!process.argv.includes("--yes")) {
  console.log("\nNothing was deleted. Run again with --yes to clear products, categories, orders, bags and the activity log.");
  await prisma.$disconnect();
  process.exit(0);
}

await prisma.$transaction([
  prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "OrderEvent", "OrderItem", "Order", "CartItem", "Cart",
       "ProductImage", "ProductVariant", "Product", "NavItem", "Category", "ActivityLog"
     RESTART IDENTITY`,
  ),
  prisma.coupon.updateMany({ data: { usedCount: 0 } }),
]);

console.log("After:", await count());
console.log("Done. Admins, coupons, banners and the store-wide offer were kept.");
await prisma.$disconnect();
