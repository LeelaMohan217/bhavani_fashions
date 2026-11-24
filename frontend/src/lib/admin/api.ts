// Server-side access to the admin API. Reads the session token from the httpOnly
// `bf_admin` cookie and sends it as a Bearer token. Any 401 sends the user to sign in.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type {
  Admin,
  AdminAlerts,
  AdminBanner,
  AdminPromotion,
  AdminCategory,
  AdminOrder,
  AdminOrderList,
  AdminProduct,
  AdminProductList,
  Dashboard,
} from "./types";

export const API_URL = process.env.API_URL ?? "http://localhost:4000";
export const ADMIN_COOKIE = "bf_admin";

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

export async function adminFetch<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) redirect("/admin/login");

  const res = await fetch(`${API_URL}/api/admin${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body !== undefined && { "Content-Type": "application/json" }),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  if (res.status === 401) redirect("/admin/login");
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fieldErrors = Array.isArray(data.details)
      ? Object.fromEntries(data.details.map((d: { path: string; message: string }) => [d.path, d.message]))
      : undefined;
    throw new AdminApiError(res.status, data.error ?? "Something went wrong.", fieldErrors);
  }
  return data as T;
}

const qs = (params: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const getMe = () => adminFetch<Admin>("/auth/me");
export const getDashboard = () => adminFetch<Dashboard>("/dashboard");
export const getAlerts = () => adminFetch<AdminAlerts>("/alerts");
export const getCategories = () => adminFetch<AdminCategory[]>("/categories");

export const getOrders = (q: { status?: string; search?: string; payment?: string; page?: number; pageSize?: number }) =>
  adminFetch<AdminOrderList>(`/orders${qs(q)}`);

export async function getOrder(id: string) {
  try {
    return await adminFetch<AdminOrder>(`/orders/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof AdminApiError && e.status === 404) return null;
    throw e;
  }
}

export const getProducts = (q: { status?: string; search?: string; category?: string; page?: number; pageSize?: number }) =>
  adminFetch<AdminProductList>(`/products${qs(q)}`);

export async function getProduct(id: string) {
  try {
    return await adminFetch<AdminProduct>(`/products/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof AdminApiError && e.status === 404) return null;
    throw e;
  }
}

export const getBanners = () => adminFetch<AdminBanner[]>("/banners");

export async function getBanner(id: string): Promise<AdminBanner | null> {
  try {
    return await adminFetch<AdminBanner>(`/banners/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof AdminApiError && e.status === 404) return null;
    throw e;
  }
}

/** The latest store-wide offer (running or not), or null */
export const getPromotion = () => adminFetch<AdminPromotion | null>("/promotion");
