import { z } from "zod";
import type { OrderStatus, Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { HttpError, notFound } from "../lib/http-error.js";
import { formatOrderNumber } from "../config/store.js";
import { releaseCouponUse } from "./coupons.js";

/** Comma-separated multi-select param, e.g. "SHIPPED,DELIVERED" → ["SHIPPED", "DELIVERED"] */
const csvOf = <T extends string>(values: readonly [T, ...T[]]) =>
  z
    .string()
    .optional()
    .transform((s) => (s ? s.split(",").map((v) => v.trim()).filter(Boolean) : []))
    .pipe(z.array(z.enum(values)));

const STATUS_FILTERS = ["all", "to-fulfil", "PENDING_PAYMENT", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export const OrderListQuery = z.object({
  status: csvOf(STATUS_FILTERS),
  search: z.string().trim().optional(),
  payment: csvOf(["COD", "RAZORPAY"] as const),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const StatusUpdate = z.object({
  status: z.enum(["PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]),
  courierName: z.string().trim().max(60).optional(),
  trackingNumber: z.string().trim().max(60).optional(),
  note: z.string().trim().max(500).optional(),
});

/** Allowed manual transitions */
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  CONFIRMED: ["PACKED", "SHIPPED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};


export async function listOrders(q: z.infer<typeof OrderListQuery>) {
  const numberMatch = q.search?.match(/^(?:BF)?(\d{5,})$/i);
  // "to-fulfil" is shorthand for confirmed + packed; "all" (or nothing) means no status filter
  const statuses = [
    ...new Set(
      q.status.flatMap((s): OrderStatus[] => (s === "to-fulfil" ? ["CONFIRMED", "PACKED"] : s === "all" ? [] : [s])),
    ),
  ];
  const where: Prisma.OrderWhereInput = {
    ...(statuses.length > 0 && { status: { in: statuses } }),
    ...(q.payment.length > 0 && { paymentMethod: { in: q.payment } }),
    ...(q.search && {
      OR: [
        ...(numberMatch ? [{ number: Number(numberMatch[1]) - 10000 }] : []),
        { fullName: { contains: q.search, mode: "insensitive" } },
        { phone: { contains: q.search.replace(/\D/g, "") || q.search } },
        { email: { contains: q.search, mode: "insensitive" } },
      ],
    }),
  };

  const [total, rows, counts] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      include: { _count: { select: { items: true } }, items: { select: { quantity: true } } },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  return {
    items: rows.map((o) => ({
      id: o.id,
      number: formatOrderNumber(o.number),
      createdAt: o.createdAt,
      fullName: o.fullName,
      phone: o.phone,
      city: o.city,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      total: o.total,
      pieces: o.items.reduce((n, i) => n + i.quantity, 0),
    })),
    total,
    page: q.page,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Partial<Record<OrderStatus, number>>,
  };
}

export async function getAdminOrder(id: string) {
  const o = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: "desc" }, include: { admin: { select: { name: true } } } },
    },
  });
  if (!o) throw notFound("Order");
  return {
    ...o,
    number: formatOrderNumber(o.number),
    allowedTransitions: NEXT[o.status],
    events: o.events.map((e) => ({ id: e.id, type: e.type, message: e.message, createdAt: e.createdAt, by: e.admin?.name ?? null })),
  };
}

export async function updateOrderStatus(id: string, input: z.infer<typeof StatusUpdate>, adminId: string) {
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw notFound("Order");
  if (!NEXT[order.status].includes(input.status)) {
    throw new HttpError(409, `An order that is ${order.status.toLowerCase().replace("_", " ")} can't be marked ${input.status.toLowerCase()}.`);
  }
  if (input.status === "SHIPPED" && (!input.courierName || !input.trackingNumber)) {
    throw new HttpError(400, "Courier and tracking number are required to mark an order shipped.");
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const data: Prisma.OrderUpdateInput = { status: input.status };
    let message = `Marked ${input.status.toLowerCase()}`;

    if (input.status === "SHIPPED") {
      Object.assign(data, { shippedAt: now, courierName: input.courierName, trackingNumber: input.trackingNumber });
      message = `Shipped via ${input.courierName} · ${input.trackingNumber}`;
    }
    if (input.status === "DELIVERED") {
      data.deliveredAt = now;
      if (order.paymentStatus === "COD_DUE") {
        data.paymentStatus = "PAID";
        message = "Delivered · cash collected";
      }
    }
    if (input.status === "CANCELLED") {
      data.cancelledAt = now;
      // Stock was only taken for confirmed orders — give it back.
      if (order.status !== "PENDING_PAYMENT") {
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
          }
        }
        message = "Cancelled · stock returned";
      } else {
        message = "Cancelled";
      }
      // The order no longer counts towards its coupon's usage limit
      if (order.couponCode && order.couponCounted) {
        await releaseCouponUse(tx, order.couponCode);
        data.couponCounted = false;
      }
      if (order.paymentStatus === "PAID") {
        data.paymentStatus = "REFUND_DUE";
        message += " · refund due";
      }
    }

    await tx.order.update({ where: { id }, data });
    await tx.orderEvent.create({
      data: { orderId: id, adminId, type: `status:${input.status}`, message: input.note ? `${message}. Note: ${input.note}` : message },
    });
  });

  return getAdminOrder(id);
}

export async function markRefunded(id: string, adminId: string) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw notFound("Order");
  if (order.paymentStatus !== "REFUND_DUE") throw new HttpError(409, "This order has no refund due.");
  await prisma.$transaction([
    prisma.order.update({ where: { id }, data: { paymentStatus: "REFUNDED" } }),
    prisma.orderEvent.create({ data: { orderId: id, adminId, type: "payment:REFUNDED", message: "Refund recorded as issued" } }),
  ]);
  return getAdminOrder(id);
}

/** Lightweight "needs attention" summary for the admin bell. */
export async function alerts() {
  const LOW = 3;
  const [toFulfilCount, toFulfil, refundsDue, lowStockCount, lowStock] = await Promise.all([
    prisma.order.count({ where: { status: { in: ["CONFIRMED", "PACKED"] } } }),
    prisma.order.findMany({
      where: { status: { in: ["CONFIRMED", "PACKED"] } },
      orderBy: { createdAt: "asc" }, // oldest first — they've waited longest
      take: 5,
      select: { id: true, number: true, fullName: true, total: true, createdAt: true, status: true },
    }),
    prisma.order.findMany({
      where: { paymentStatus: "REFUND_DUE" },
      orderBy: { updatedAt: "asc" },
      take: 5,
      select: { id: true, number: true, fullName: true, total: true, updatedAt: true },
    }),
    prisma.productVariant.count({ where: { stock: { lte: LOW }, product: { isActive: true } } }),
    prisma.productVariant.findMany({
      where: { stock: { lte: LOW }, product: { isActive: true } },
      orderBy: { stock: "asc" },
      take: 5,
      select: { id: true, color: true, size: true, stock: true, product: { select: { id: true, name: true } } },
    }),
  ]);

  return {
    total: toFulfilCount + refundsDue.length + lowStockCount,
    toFulfilCount,
    toFulfil: toFulfil.map((o) => ({ ...o, number: formatOrderNumber(o.number) })),
    refundsDue: refundsDue.map((o) => ({ ...o, number: formatOrderNumber(o.number) })),
    lowStockCount,
    lowStock,
  };
}

// The store runs on Indian time: "today", "same day last week" and the monthly chart use IST
// calendar days/months whatever the server's own time zone is.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Shift a UTC instant so its UTC fields read as IST wall-clock time */
const toIst = (d: Date) => new Date(d.getTime() + IST_OFFSET_MS);
const fromIst = (istWallClockMs: number) => new Date(istWallClockMs - IST_OFFSET_MS);
const istMonthKey = (d: Date) => toIst(d).toISOString().slice(0, 7); // "2026-11"

export async function dashboard() {
  const now = new Date();
  const nowIst = toIst(now);
  const startOfToday = fromIst(Math.floor(nowIst.getTime() / DAY_MS) * DAY_MS);
  // Same IST day last week, up to the same time of day, for a fair "vs last week"
  const lastWeekStart = new Date(startOfToday.getTime() - 7 * DAY_MS);
  const lastWeekNow = new Date(now.getTime() - 7 * DAY_MS);
  // First day of the IST month 11 months ago → 12 months including this one
  const monthsStart = fromIst(Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth() - 11, 1));
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const live: Prisma.OrderWhereInput = { status: { notIn: ["PENDING_PAYMENT", "CANCELLED"] } };

  const [today, month, toFulfil, byMethod, lowStockCount, lowStock, recent, lastWeek, year, soldOutCount] = await Promise.all([
    prisma.order.aggregate({ where: { ...live, createdAt: { gte: startOfToday } }, _count: true, _sum: { total: true } }),
    prisma.order.aggregate({ where: { ...live, createdAt: { gte: thirtyDaysAgo } }, _count: true, _sum: { total: true } }),
    prisma.order.count({ where: { status: { in: ["CONFIRMED", "PACKED"] } } }),
    prisma.order.groupBy({
      by: ["paymentMethod"],
      where: { ...live, createdAt: { gte: thirtyDaysAgo } },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.productVariant.count({ where: { stock: { lte: 3 }, product: { isActive: true } } }),
    prisma.productVariant.findMany({
      where: { stock: { lte: 3 }, product: { isActive: true } },
      orderBy: { stock: "asc" },
      take: 8,
      select: { id: true, sku: true, color: true, size: true, stock: true, product: { select: { id: true, name: true } } },
    }),
    prisma.order.findMany({
      where: { status: { not: "PENDING_PAYMENT" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, number: true, fullName: true, total: true, status: true, paymentMethod: true, createdAt: true },
    }),
    prisma.order.aggregate({
      where: { ...live, createdAt: { gte: lastWeekStart, lt: lastWeekNow } },
      _count: true,
      _sum: { total: true },
    }),
    prisma.order.findMany({ where: { ...live, createdAt: { gte: monthsStart } }, select: { createdAt: true, total: true } }),
    // Of the low-stock variants, how many are already sold out (for the dashboard warning)
    prisma.productVariant.count({ where: { stock: 0, product: { isActive: true } } }),
  ]);

  // Last 12 IST months, oldest first, including months with no sales
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth() - 11 + i, 1));
    return { month: d.toISOString().slice(0, 7), orders: 0, revenue: 0 };
  });
  for (const o of year) {
    const m = monthly.find((x) => x.month === istMonthKey(o.createdAt));
    if (m) {
      m.orders += 1;
      m.revenue += o.total;
    }
  }

  const method = (m: "COD" | "RAZORPAY") => {
    const row = byMethod.find((r) => r.paymentMethod === m);
    return { orders: row?._count._all ?? 0, revenue: row?._sum.total ?? 0 };
  };

  return {
    today: { orders: today._count, revenue: today._sum.total ?? 0 },
    last30: { orders: month._count, revenue: month._sum.total ?? 0 },
    toFulfil,
    paymentSplit: { cod: method("COD"), prepaid: method("RAZORPAY") },
    lowStockCount,
    soldOutCount,
    lowStock,
    recentOrders: recent.map((o) => ({ ...o, number: formatOrderNumber(o.number) })),
    sameDayLastWeek: { orders: lastWeek._count, revenue: lastWeek._sum.total ?? 0 },
    monthly,
  };
}
