// Admin → Best sellers: which products sell, by period. Built from real orders only.
import { z } from "zod";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

/** Orders that really went through (not unpaid or cancelled) */
const COUNTED = ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;

export const BestSellersQuery = z.object({
  period: z.enum(["this-month", "last-month", "all"]).default("this-month"),
  sort: z.enum(["units", "revenue"]).default("units"),
  category: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

// The store runs on Indian time (UTC+5:30, no daylight saving): months start at midnight IST.
const IST_MS = 5.5 * 60 * 60 * 1000;
function istMonthStart(offsetMonths: number) {
  const nowIst = new Date(Date.now() + IST_MS);
  return new Date(Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth() + offsetMonths, 1) - IST_MS);
}

export function periodRange(period: z.infer<typeof BestSellersQuery>["period"]) {
  if (period === "this-month") return { from: istMonthStart(0), to: undefined };
  if (period === "last-month") return { from: istMonthStart(-1), to: istMonthStart(0) };
  return { from: undefined, to: undefined };
}

export async function bestSellers(q: z.infer<typeof BestSellersQuery>) {
  const { from, to } = periodRange(q.period);
  const where: Prisma.OrderItemWhereInput = {
    order: { status: { in: [...COUNTED] }, ...((from || to) && { createdAt: { gte: from, lt: to } }) },
    ...(q.category && {
      variant: { product: { category: { OR: [{ slug: q.category }, { parent: { slug: q.category } }] } } },
    }),
  };

  const items = await prisma.orderItem.findMany({
    where,
    select: {
      orderId: true,
      quantity: true,
      lineTotal: true,
      productName: true,
      productSlug: true,
      imageUrl: true,
      variant: { select: { product: { select: { id: true, name: true, slug: true, isActive: true, category: { select: { name: true } } } } } },
    },
  });

  // Group by the current product (so renames still add up); items whose variant was deleted
  // fall back to the name and link saved on the order
  type Row = {
    key: string;
    productId: string | null;
    name: string;
    slug: string;
    category: string | null;
    image: string | null;
    isActive: boolean;
    units: number;
    revenue: number;
    orders: Set<string>;
  };
  const rows = new Map<string, Row>();
  let units = 0;
  let revenue = 0;
  const orders = new Set<string>();

  for (const it of items) {
    const p = it.variant?.product;
    const key = p?.id ?? `slug:${it.productSlug}`;
    let row = rows.get(key);
    if (!row) {
      row = {
        key,
        productId: p?.id ?? null,
        name: p?.name ?? it.productName,
        slug: p?.slug ?? it.productSlug,
        category: p?.category.name ?? null,
        image: it.imageUrl,
        isActive: p?.isActive ?? false,
        units: 0,
        revenue: 0,
        orders: new Set(),
      };
      rows.set(key, row);
    }
    row.units += it.quantity;
    row.revenue += it.lineTotal;
    row.orders.add(it.orderId);
    units += it.quantity;
    revenue += it.lineTotal;
    orders.add(it.orderId);
  }

  const ranked = [...rows.values()]
    .map(({ orders: o, ...r }) => ({ ...r, orders: o.size }))
    .sort((a, b) => (q.sort === "revenue" ? b.revenue - a.revenue || b.units - a.units : b.units - a.units || b.revenue - a.revenue));

  return {
    period: q.period,
    from: from ?? null,
    to: to ?? null,
    totals: { units, revenue, orders: orders.size, products: ranked.length },
    items: ranked.slice(0, q.limit),
  };
}
