import { z } from "zod";
import type { OrderStatus, Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/http-error.js";
import { formatOrderNumber } from "../config/store.js";

/**
 * Shoppers check out as guests, so a customer is everyone who ordered with the same mobile
 * number. Name, email and city come from their latest order.
 */

/** Orders that went through; these count towards "spent" */
const SALE: OrderStatus[] = ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];
/** Unpaid online orders that were never completed aren't real orders yet */
const PLACED: Prisma.OrderWhereInput = { status: { not: "PENDING_PAYMENT" } };

export const CustomerListQuery = z.object({
  search: z.string().trim().max(80).optional(),
  sort: z.enum(["recent", "spent", "orders"]).default("recent"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export async function listCustomers(q: z.infer<typeof CustomerListQuery>) {
  const digits = q.search?.replace(/\D/g, "");
  const where: Prisma.OrderWhereInput = {
    ...PLACED,
    ...(q.search && {
      OR: [
        { fullName: { contains: q.search, mode: "insensitive" } },
        { email: { contains: q.search, mode: "insensitive" } },
        ...(digits ? [{ phone: { contains: digits } }] : []),
      ],
    }),
  };

  // One row per phone. Small shop: grouping everything then paging in memory keeps the sorts simple.
  const [groups, spent] = await Promise.all([
    prisma.order.groupBy({ by: ["phone"], where, _count: { _all: true }, _max: { createdAt: true } }),
    prisma.order.groupBy({ by: ["phone"], where: { AND: [where, { status: { in: SALE } }] }, _sum: { total: true } }),
  ]);
  const spentBy = new Map(spent.map((s) => [s.phone, s._sum.total ?? 0]));

  const rows = groups.map((g) => ({
    phone: g.phone,
    orders: g._count._all,
    spent: spentBy.get(g.phone) ?? 0,
    lastOrderAt: g._max.createdAt!,
  }));
  rows.sort((a, b) =>
    q.sort === "spent"
      ? b.spent - a.spent || +b.lastOrderAt - +a.lastOrderAt
      : q.sort === "orders"
        ? b.orders - a.orders || +b.lastOrderAt - +a.lastOrderAt
        : +b.lastOrderAt - +a.lastOrderAt,
  );

  const pageRows = rows.slice((q.page - 1) * q.pageSize, q.page * q.pageSize);
  const latest = await prisma.order.findMany({
    where: { ...PLACED, phone: { in: pageRows.map((r) => r.phone) } },
    orderBy: { createdAt: "desc" },
    distinct: ["phone"],
    select: { phone: true, fullName: true, email: true, city: true, state: true },
  });
  const info = new Map(latest.map((o) => [o.phone, o]));

  return {
    items: pageRows.map((r) => {
      const i = info.get(r.phone);
      return { ...r, name: i?.fullName ?? "", email: i?.email ?? "", city: i?.city ?? "", state: i?.state ?? "" };
    }),
    total: rows.length,
    page: q.page,
    totalPages: Math.max(1, Math.ceil(rows.length / q.pageSize)),
  };
}

export async function getCustomer(phone: string) {
  const orders = await prisma.order.findMany({
    where: { ...PLACED, phone },
    orderBy: { createdAt: "desc" },
    include: { items: { select: { quantity: true } } },
  });
  if (orders.length === 0) throw notFound("Customer");
  const last = orders[0];
  const sales = orders.filter((o) => SALE.includes(o.status));

  return {
    phone,
    name: last.fullName,
    email: last.email,
    address: { line1: last.addressLine1, line2: last.addressLine2, city: last.city, state: last.state, pincode: last.pincode },
    orders: orders.length,
    spent: sales.reduce((n, o) => n + o.total, 0),
    pieces: sales.reduce((n, o) => n + o.items.reduce((m, i) => m + i.quantity, 0), 0),
    firstOrderAt: orders[orders.length - 1].createdAt,
    lastOrderAt: last.createdAt,
    history: orders.map((o) => ({
      id: o.id,
      number: formatOrderNumber(o.number),
      createdAt: o.createdAt,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      total: o.total,
      pieces: o.items.reduce((n, i) => n + i.quantity, 0),
    })),
  };
}
