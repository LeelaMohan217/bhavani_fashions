import { z } from "zod";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { HttpError, notFound } from "../lib/http-error.js";
import { createRazorpayOrder, razorpayKeyId, verifyPaymentSignature } from "../lib/razorpay.js";
import { env } from "../config/env.js";
import { STORE, formatOrderNumber } from "../config/store.js";
import { INDIAN_STATES } from "../config/india.js";
import { getCart } from "./cart.js";

// ─── Validation ──────────────────────────────────────────────────────────────

const phone = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"));

export const PlaceOrderSchema = z.object({
  cartId: z.string().min(1),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  phone,
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  addressLine1: z.string().trim().min(5, "Enter your house number and street").max(120),
  addressLine2: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => v || undefined),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.enum(INDIAN_STATES, { error: "Choose your state" }),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
});

export const VerifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

class OutOfStockError extends HttpError {
  constructor() {
    super(409, "Sorry, a piece in your bag sold out while you were checking out.");
  }
}

type Tx = Prisma.TransactionClient;

/** Atomically decrements stock for each line, failing if any line can't be fulfilled. */
async function reserveStock(tx: Tx, lines: { variantId: string | null; quantity: number }[]) {
  for (const line of lines) {
    if (!line.variantId) throw new OutOfStockError();
    const res = await tx.productVariant.updateMany({
      where: { id: line.variantId, stock: { gte: line.quantity } },
      data: { stock: { decrement: line.quantity } },
    });
    if (res.count === 0) throw new OutOfStockError();
  }
}

/** Removes the purchased pieces from the bag (leaves anything added afterwards). */
async function clearPurchased(tx: Tx, cartId: string | null, variantIds: (string | null)[]) {
  if (!cartId) return;
  await tx.cartItem.deleteMany({
    where: { cartId, variantId: { in: variantIds.filter((v): v is string => Boolean(v)) } },
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function checkoutConfig() {
  return {
    razorpayEnabled: env.razorpayEnabled,
    shippingFee: STORE.shippingFee,
    codFee: STORE.codFee,
  };
}

export async function placeOrder(input: z.infer<typeof PlaceOrderSchema>) {
  const cart = await getCart(input.cartId);
  if (cart.items.length === 0) throw new HttpError(400, "Your bag is empty.");
  if (cart.items.some((i) => i.unavailable)) {
    throw new HttpError(409, "Some pieces in your bag are no longer available. Please review your bag.");
  }
  if (input.paymentMethod === "RAZORPAY" && !env.razorpayEnabled) {
    throw new HttpError(503, "Online payment is unavailable right now. Please choose cash on delivery.");
  }

  const codFee = input.paymentMethod === "COD" ? STORE.codFee : 0;
  const total = cart.subtotal + STORE.shippingFee + codFee;
  const { cartId, ...customer } = input;

  const orderData = {
    ...customer,
    subtotal: cart.subtotal,
    shippingFee: STORE.shippingFee,
    codFee,
    total,
    cartId,
    items: {
      create: cart.items.map((i) => ({
        variantId: i.variantId,
        productName: i.productName,
        productSlug: i.productSlug,
        imageUrl: i.image?.url,
        color: i.color,
        size: i.size,
        sku: i.sku,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        lineTotal: i.lineTotal,
      })),
    },
  } satisfies Omit<Prisma.OrderCreateInput, "paymentMethod">;

  if (input.paymentMethod === "COD") {
    const order = await prisma.$transaction(async (tx) => {
      await reserveStock(tx, cart.items);
      const created = await tx.order.create({
        data: {
          ...orderData,
          paymentMethod: "COD",
          status: "CONFIRMED",
          paymentStatus: "COD_DUE",
          confirmedAt: new Date(),
        },
      });
      await clearPurchased(tx, cartId, cart.items.map((i) => i.variantId));
      return created;
    });
    return { orderId: order.id, status: order.status };
  }

  // Online payment: create a pending order, then a matching Razorpay order.
  const order = await prisma.order.create({ data: { ...orderData, paymentMethod: "RAZORPAY" } });
  const rzp = await createRazorpayOrder({
    amount: total,
    receipt: formatOrderNumber(order.number),
    notes: { orderId: order.id },
  });
  await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: rzp.id } });

  return {
    orderId: order.id,
    status: order.status,
    razorpay: {
      keyId: razorpayKeyId(),
      orderId: rzp.id,
      amount: rzp.amount,
      currency: rzp.currency,
      name: "Kosha",
      description: `Order ${formatOrderNumber(order.number)}`,
      prefill: { name: order.fullName, email: order.email, contact: order.phone },
    },
  };
}

export async function verifyPayment(input: z.infer<typeof VerifyPaymentSchema>) {
  const order = await prisma.order.findUnique({ where: { id: input.orderId }, include: { items: true } });
  if (!order || order.paymentMethod !== "RAZORPAY") throw notFound("Order");
  if (order.razorpayOrderId !== input.razorpayOrderId) throw new HttpError(400, "Payment does not match this order.");

  if (!verifyPaymentSignature(input.razorpayOrderId, input.razorpayPaymentId, input.razorpaySignature)) {
    throw new HttpError(400, "We couldn't verify this payment. If money was deducted, it will be refunded.");
  }

  const outcome = await confirmPaidOrder(order.id, input.razorpayPaymentId, "checkout");
  if (outcome === "confirmed" || outcome === "already_confirmed") return { orderId: order.id, status: "CONFIRMED" as const };
  if (outcome === "sold_out") {
    throw new HttpError(
      409,
      "A piece sold out just before your payment completed. Your order is cancelled and a full refund will be issued within 5 to 7 days.",
    );
  }
  throw new HttpError(409, "This order can no longer be paid. If money was deducted, it will be refunded.");
}

export type PaidOutcome = "confirmed" | "already_confirmed" | "sold_out" | "not_payable";

/**
 * Marks a Razorpay order as paid: takes the stock, empties those pieces from the bag and logs it.
 * Called by both the shopper's browser (after checkout) and Razorpay's webhook, possibly at the
 * same moment, so it only ever runs once per order: the first caller moves the order out of
 * PENDING_PAYMENT inside the transaction, and the database makes any second caller wait and then
 * find nothing to update.
 */
export async function confirmPaidOrder(orderId: string, paymentId: string, via: "checkout" | "webhook"): Promise<PaidOutcome> {
  try {
    return await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id: orderId, status: "PENDING_PAYMENT" },
        data: { status: "CONFIRMED", paymentStatus: "PAID", razorpayPaymentId: paymentId, confirmedAt: new Date() },
      });

      if (claimed.count === 0) {
        const current = await tx.order.findUnique({ where: { id: orderId }, select: { status: true, paymentStatus: true } });
        if (!current) return "not_payable";
        if (current.status !== "CANCELLED") return "already_confirmed";
        if (current.paymentStatus === "REFUND_DUE" || current.paymentStatus === "REFUNDED") return "sold_out";
        // The order was cancelled (e.g. by the team) while unpaid, and the money arrived anyway
        await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "REFUND_DUE", razorpayPaymentId: paymentId } });
        await tx.orderEvent.create({
          data: { orderId, type: "payment:REFUND_DUE", message: `Payment ${paymentId} arrived after the order was cancelled · refund due` },
        });
        return "not_payable";
      }

      const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
      await reserveStock(tx, order.items);
      await clearPurchased(tx, order.cartId, order.items.map((i) => i.variantId));
      await tx.orderEvent.create({
        data: {
          orderId,
          type: "payment:PAID",
          message: via === "webhook" ? `Paid online · confirmed by Razorpay (${paymentId})` : `Paid online (${paymentId})`,
        },
      });
      return "confirmed";
    });
  } catch (e) {
    if (!(e instanceof OutOfStockError)) throw e;
    // Paid but a piece sold out first: the whole transaction rolled back, so cancel and flag the refund
    const cancelled = await prisma.order.updateMany({
      where: { id: orderId, status: "PENDING_PAYMENT" },
      data: { status: "CANCELLED", paymentStatus: "REFUND_DUE", razorpayPaymentId: paymentId, cancelledAt: new Date() },
    });
    if (cancelled.count > 0) {
      await prisma.orderEvent.create({
        data: { orderId, type: "payment:REFUND_DUE", message: `Paid (${paymentId}) but a piece had sold out · cancelled, refund due` },
      });
    }
    return "sold_out";
  }
}

export const TrackOrderSchema = z.object({
  number: z
    .string()
    .trim()
    .regex(/^(?:BF)?\d{5,}$/i, "Enter your order number, for example BF10023"),
  phone,
});

/** Finds an order by its customer-facing number plus the phone used at checkout. */
export async function trackOrder(input: z.infer<typeof TrackOrderSchema>) {
  const number = Number(input.number.replace(/^BF/i, "")) - 10000;
  const order =
    number > 0
      ? await prisma.order.findFirst({ where: { number, phone: input.phone }, select: { id: true } })
      : null;
  // Same message whether the number or the phone is wrong, so orders can't be probed.
  if (!order) throw new HttpError(404, "We couldn't find an order with that number and mobile number.");
  return { orderId: order.id };
}

export async function getOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { orderBy: { productName: "asc" } } },
  });
  if (!order) throw notFound("Order");

  return {
    id: order.id,
    number: formatOrderNumber(order.number),
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    fullName: order.fullName,
    email: order.email,
    phone: order.phone,
    address: {
      line1: order.addressLine1,
      line2: order.addressLine2,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
    },
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    codFee: order.codFee,
    total: order.total,
    createdAt: order.createdAt,
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    items: order.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      productSlug: i.productSlug,
      imageUrl: i.imageUrl,
      color: i.color,
      size: i.size,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
  };
}
