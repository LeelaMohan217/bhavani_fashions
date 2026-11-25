// Razorpay webhooks: Razorpay calls the API directly when a payment succeeds or fails, so an
// order is confirmed even if the shopper closes the tab or loses signal right after paying.
// Docs: https://razorpay.com/docs/webhooks/
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/http-error.js";
import { verifyWebhookSignature } from "../lib/razorpay.js";
import { env } from "../config/env.js";
import { confirmPaidOrder } from "./checkout.js";

const PaymentEntity = z.object({
  id: z.string(),
  order_id: z.string().nullish(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  method: z.string().nullish(),
  error_description: z.string().nullish(),
});

const WebhookEvent = z.object({
  event: z.string(),
  payload: z.object({ payment: z.object({ entity: PaymentEntity }).optional() }).passthrough(),
});

const METHOD_LABEL: Record<string, string> = {
  upi: "UPI",
  card: "card",
  netbanking: "net banking",
  wallet: "wallet",
  emi: "EMI",
  paylater: "pay later",
};

/** Handles one webhook call. Returns what happened (for the logs); throws only for a bad signature. */
export async function handleRazorpayWebhook(rawBody: Buffer, signature: string | undefined): Promise<string> {
  const secret = env.RAZORPAY_WEBHOOK_SECRET;
  // 503 makes Razorpay retry later, once the secret is configured
  if (!secret) throw new HttpError(503, "Razorpay webhooks are not configured.");
  if (!signature || !verifyWebhookSignature(rawBody, signature, secret)) {
    throw new HttpError(400, "Invalid webhook signature.");
  }

  const parsed = WebhookEvent.safeParse(JSON.parse(rawBody.toString("utf8")));
  if (!parsed.success) return "ignored: unrecognised payload";
  const { event, payload } = parsed.data;
  const payment = payload.payment?.entity;
  if (!payment?.order_id) return `ignored: ${event} without a payment order`;

  const order = await prisma.order.findUnique({
    where: { razorpayOrderId: payment.order_id },
    select: { id: true, total: true },
  });
  // Not one of ours (e.g. another site on the same Razorpay account)
  if (!order) return `ignored: no order for ${payment.order_id}`;

  if (event === "payment.failed") {
    const reason = payment.error_description ? `: ${payment.error_description}` : "";
    await prisma.orderEvent.create({
      data: { orderId: order.id, type: "payment:FAILED", message: `Online payment attempt failed${reason}` },
    });
    return `logged failed payment for ${order.id}`;
  }

  if (event !== "order.paid" && event !== "payment.captured") return `ignored: ${event}`;

  // Never confirm on a partial or different amount
  if (payment.amount !== order.total || payment.currency !== "INR") {
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "payment:MISMATCH",
        message: `Razorpay reported ${payment.currency} ${(payment.amount / 100).toFixed(2)}, but the order total is INR ${(order.total / 100).toFixed(2)}. Check the Razorpay dashboard.`,
      },
    });
    return `amount mismatch for ${order.id}`;
  }

  const outcome = await confirmPaidOrder(order.id, payment.id, "webhook");
  if (outcome === "confirmed" && payment.method && METHOD_LABEL[payment.method]) {
    await prisma.orderEvent.create({
      data: { orderId: order.id, type: "payment:METHOD", message: `Paid by ${METHOD_LABEL[payment.method]}` },
    });
  }
  return `${event}: ${outcome} (${order.id})`;
}
