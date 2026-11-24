// Minimal Razorpay client using the REST API directly (no SDK).
// Docs: https://razorpay.com/docs/api/orders/ and payment signature verification.
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { HttpError } from "./http-error.js";

function credentials() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new HttpError(503, "Online payments are not configured yet.");
  }
  return { keyId: env.RAZORPAY_KEY_ID, keySecret: env.RAZORPAY_KEY_SECRET };
}

export async function createRazorpayOrder(input: {
  amount: number; // paise
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const { keyId, keySecret } = credentials();

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({ ...input, currency: "INR" }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Razorpay order creation failed:", res.status, body);
    throw new HttpError(502, "Could not start the payment. Please try again.");
  }
  return res.json() as Promise<{ id: string; amount: number; currency: string }>;
}

/** Verifies the signature Razorpay Checkout returns after a successful payment. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const { keySecret } = credentials();
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export const razorpayKeyId = () => credentials().keyId;
