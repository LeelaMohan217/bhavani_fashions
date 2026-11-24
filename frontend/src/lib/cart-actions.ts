"use server";

// Server Functions for the bag and checkout. The browser only ever talks to Next.js;
// the cart id lives in an httpOnly cookie on the storefront domain and is forwarded to the API.
import { cookies } from "next/headers";
import type { ActionResult, Cart, PaymentMethod, RazorpayPayment } from "./types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const CART_COOKIE = "bf_cart";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: init?.method ?? "GET",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fieldErrors = Array.isArray(data.details)
      ? Object.fromEntries(data.details.map((d: { path: string; message: string }) => [d.path, d.message]))
      : undefined;
    throw new ApiError(res.status, data.error ?? "Something went wrong. Please try again.", fieldErrors);
  }
  return data as T;
}

function fail(e: unknown): { ok: false; error: string; fieldErrors?: Record<string, string> } {
  if (e instanceof ApiError) return { ok: false, error: e.message, fieldErrors: e.fieldErrors };
  console.error(e);
  return { ok: false, error: "We couldn't reach the store. Please check your connection and try again." };
}

async function readCartId() {
  return (await cookies()).get(CART_COOKIE)?.value;
}

async function writeCartId(id: string) {
  (await cookies()).set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

/** Returns the visitor's cart, or null if they don't have one yet. */
export async function getCart(): Promise<Cart | null> {
  const id = await readCartId();
  if (!id) return null;
  try {
    return await api<Cart>(`/api/carts/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null; // stale cookie
    throw e;
  }
}

async function ensureCartId(): Promise<string> {
  const existing = await getCart();
  if (existing) return existing.id;
  const created = await api<Cart>("/api/carts", { method: "POST" });
  await writeCartId(created.id);
  return created.id;
}

export async function addToCart(variantId: string, quantity = 1): Promise<ActionResult<{ cart: Cart }>> {
  try {
    const id = await ensureCartId();
    const cart = await api<Cart>(`/api/carts/${id}/items`, { method: "POST", body: { variantId, quantity } });
    return { ok: true, cart };
  } catch (e) {
    return fail(e);
  }
}

export async function updateCartItem(itemId: string, quantity: number): Promise<ActionResult<{ cart: Cart }>> {
  try {
    const id = await readCartId();
    if (!id) return { ok: false, error: "Your bag has expired. Please add the piece again." };
    const cart = await api<Cart>(`/api/carts/${id}/items/${encodeURIComponent(itemId)}`, {
      method: "PATCH",
      body: { quantity },
    });
    return { ok: true, cart };
  } catch (e) {
    return fail(e);
  }
}

export async function removeCartItem(itemId: string): Promise<ActionResult<{ cart: Cart }>> {
  return updateCartItem(itemId, 0);
}

export type CheckoutForm = {
  email: string;
  phone: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: PaymentMethod;
};

export async function placeOrder(
  form: CheckoutForm,
): Promise<ActionResult<{ orderId: string; razorpay?: RazorpayPayment }>> {
  try {
    const cartId = await readCartId();
    if (!cartId) return { ok: false, error: "Your bag is empty." };
    const res = await api<{ orderId: string; razorpay?: RazorpayPayment }>("/api/checkout", {
      method: "POST",
      body: { ...form, cartId },
    });
    return { ok: true, ...res };
  } catch (e) {
    return fail(e);
  }
}

export async function verifyPayment(input: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<ActionResult<{ orderId: string }>> {
  try {
    const res = await api<{ orderId: string }>("/api/checkout/verify", { method: "POST", body: input });
    return { ok: true, orderId: res.orderId };
  } catch (e) {
    return fail(e);
  }
}
