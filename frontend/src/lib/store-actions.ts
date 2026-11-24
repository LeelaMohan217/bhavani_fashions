"use server";

// Server Functions for the header search and order tracking.
import { getProducts } from "./api";
import type { ActionResult, ProductCard } from "./types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function searchProducts(query: string): Promise<{ items: ProductCard[]; total: number }> {
  const q = query.trim().slice(0, 80);
  if (q.length < 2) return { items: [], total: 0 };
  try {
    const list = await getProducts({ q, pageSize: 6 });
    return { items: list.items, total: list.total };
  } catch (e) {
    console.error(e);
    return { items: [], total: 0 };
  }
}

export async function trackOrder(number: string, phone: string): Promise<ActionResult<{ orderId: string }>> {
  try {
    const res = await fetch(`${API_URL}/api/orders/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number, phone }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const fieldErrors = Array.isArray(data.details)
        ? Object.fromEntries(data.details.map((d: { path: string; message: string }) => [d.path, d.message]))
        : undefined;
      return { ok: false, error: data.error ?? "Something went wrong. Please try again.", fieldErrors };
    }
    return { ok: true, orderId: data.orderId };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "We couldn't reach the store. Please check your connection and try again." };
  }
}
