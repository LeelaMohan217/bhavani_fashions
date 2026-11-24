"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import type { ActionResult, OrderStatus } from "../types";
import { ADMIN_COOKIE, API_URL, AdminApiError, adminFetch } from "./api";
import type { AdminBanner, AdminOrder, AdminProduct, AdminPromotion, BannerPayload, ProductPayload, PromotionPayload } from "./types";

function fail(e: unknown): { ok: false; error: string; fieldErrors?: Record<string, string> } {
  // redirect() works by throwing — let it through
  if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) {
    throw e;
  }
  if (e instanceof AdminApiError) return { ok: false, error: e.message, fieldErrors: e.fieldErrors };
  console.error(e);
  return { ok: false, error: "Couldn't reach the server. Please try again." };
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export type LoginState = { error?: string; email?: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  const forwardedFor = (await headers()).get("x-forwarded-for") ?? undefined;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(forwardedFor && { "X-Forwarded-For": forwardedFor }) },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return { error: "Couldn't reach the server. Please try again.", email };
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: res.status === 400 ? "Enter a valid email and password." : data.error, email };
  }

  (await cookies()).set(ADMIN_COOKIE, data.token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(data.expiresAt),
  });

  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  try {
    await adminFetch("/auth/logout", { method: "POST" });
  } catch {
    // Session may already be gone — still clear the cookie.
  }
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function updateOrderStatus(
  id: string,
  input: { status: OrderStatus; courierName?: string; trackingNumber?: string; note?: string },
): Promise<ActionResult<{ order: AdminOrder }>> {
  try {
    const order = await adminFetch<AdminOrder>(`/orders/${encodeURIComponent(id)}/status`, { method: "POST", body: input });
    return { ok: true, order };
  } catch (e) {
    return fail(e);
  }
}

export async function markRefunded(id: string): Promise<ActionResult<{ order: AdminOrder }>> {
  try {
    const order = await adminFetch<AdminOrder>(`/orders/${encodeURIComponent(id)}/refunded`, { method: "POST" });
    return { ok: true, order };
  } catch (e) {
    return fail(e);
  }
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function saveProduct(
  id: string | null,
  payload: ProductPayload,
): Promise<ActionResult<{ product: AdminProduct }>> {
  try {
    const product = await adminFetch<AdminProduct>(id ? `/products/${encodeURIComponent(id)}` : "/products", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    return { ok: true, product };
  } catch (e) {
    return fail(e);
  }
}

export async function setProductActive(id: string, isActive: boolean): Promise<ActionResult<{ isActive: boolean }>> {
  try {
    const res = await adminFetch<{ isActive: boolean }>(`/products/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: { isActive },
    });
    return { ok: true, isActive: res.isActive };
  } catch (e) {
    return fail(e);
  }
}

// ─── Home-page banners ───────────────────────────────────────────────────────
// Each change refreshes the storefront's cached banners straight away.

export async function saveBanner(id: string | null, payload: BannerPayload): Promise<ActionResult<{ banner: AdminBanner }>> {
  try {
    const banner = await adminFetch<AdminBanner>(id ? `/banners/${encodeURIComponent(id)}` : "/banners", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    updateTag("banners");
    return { ok: true, banner };
  } catch (e) {
    return fail(e);
  }
}

export async function setBannerActive(id: string, isActive: boolean): Promise<ActionResult<{ isActive: boolean }>> {
  try {
    const res = await adminFetch<AdminBanner>(`/banners/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { isActive } });
    updateTag("banners");
    return { ok: true, isActive: res.isActive };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteBanner(id: string): Promise<ActionResult<object>> {
  try {
    await adminFetch(`/banners/${encodeURIComponent(id)}`, { method: "DELETE" });
    updateTag("banners");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function reorderBanners(ids: string[]): Promise<ActionResult<{ banners: AdminBanner[] }>> {
  try {
    const banners = await adminFetch<AdminBanner[]>("/banners/order", { method: "PUT", body: { ids } });
    updateTag("banners");
    return { ok: true, banners };
  } catch (e) {
    return fail(e);
  }
}

// ─── Store-wide offer (Black Friday etc.) ────────────────────────────────────

export async function savePromotion(payload: PromotionPayload): Promise<ActionResult<{ promotion: AdminPromotion }>> {
  try {
    const promotion = await adminFetch<AdminPromotion>("/promotion", { method: "PUT", body: payload });
    // Prices on every product list and page change with the offer
    updateTag("promotion");
    updateTag("catalogue");
    return { ok: true, promotion };
  } catch (e) {
    return fail(e);
  }
}
