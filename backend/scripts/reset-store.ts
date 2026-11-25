// Clears the store so it can be filled from the admin.
//
// Always deletes: products (photos, colours/sizes, stock), categories, orders (and their items and
// history), shopping bags, the activity log and the custom header/footer menus (they link to
// categories, so the menus go back to following the categories automatically). Order numbers
// restart at BF10001.
// With --everything it also deletes: home-page banners, coupon codes and the store-wide offer.
// Never deletes: admin accounts (so you can still sign in).
//
// Usage:
//   npm run store:reset                          shows what's there, deletes nothing
//   npm run store:reset -- --yes                 clears the catalogue and orders
//   npm run store:reset -- --yes --everything    also clears banners, coupons and the offer
// It uses DATABASE_URL, so check the "Database:" line before running with --yes.
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

const everything = process.argv.includes("--everything");
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
  banners: await prisma.banner.count(),
  coupons: await prisma.coupon.count(),
  offers: await prisma.promotion.count(),
  admins: await prisma.adminUser.count(),
});

console.log(`Database: ${target}`);
console.log("Now:", await count());

if (!process.argv.includes("--yes")) {
  console.log(
    "\nNothing was deleted. Add --yes to clear products, categories, orders, bags and the activity log," +
      "\nor --yes --everything to also clear banners, coupons and the store-wide offer.",
  );
  await prisma.$disconnect();
  process.exit(0);
}

const tables = [
  '"OrderEvent"', '"OrderItem"', '"Order"', '"CartItem"', '"Cart"',
  '"ProductImage"', '"ProductVariant"', '"Product"', '"NavItem"', '"Category"', '"ActivityLog"',
  ...(everything ? ['"Banner"', '"Coupon"', '"Promotion"'] : []),
];

await prisma.$transaction([
  prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables.join(", ")} RESTART IDENTITY`),
  ...(everything ? [] : [prisma.coupon.updateMany({ data: { usedCount: 0 } })]),
]);

console.log("After:", await count());
console.log(
  everything
    ? "Done. Everything was cleared except admin accounts."
    : "Done. Admins, coupons, banners and the store-wide offer were kept.",
);
await prisma.$disconnect();
