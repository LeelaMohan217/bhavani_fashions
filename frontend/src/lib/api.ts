// Server-side data access for the storefront. Results are cached for a few minutes
// with Next.js Cache Components ("use cache") and tagged so they can be revalidated.
import { cacheLife, cacheTag } from "next/cache";
import type {
  Banner,
  Category,
  NavMenu,
  Promotion,
  CheckoutConfig,
  OrderDetail,
  ProductDetail,
  ProductFilters,
  ProductList,
  SortOption,
} from "./types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

class ApiError extends Error {
  constructor(public status: number, path: string) {
    super(`API ${status} for ${path}`);
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new ApiError(res.status, path);
  return res.json() as Promise<T>;
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalogue");
  return get<Category[]>("/api/categories");
}

export async function getCategory(slug: string): Promise<Category | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalogue");
  try {
    return await get<Category>(`/api/categories/${encodeURIComponent(slug)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export type ProductQuery = {
  q?: string;
  category?: string;
  featured?: boolean;
  isNew?: boolean;
  /** Only marked-down products */
  sale?: boolean;
  /** Any of these occasions, e.g. ["Wedding", "Festive"] */
  occasion?: string[];
  /** Any of these subcategories (slugs) */
  type?: string[];
  /** Any of these colours / fabrics */
  color?: string[];
  fabric?: string[];
  /** Any of these shopper-facing price bands, in paise; max is exclusive */
  price?: { min?: number; max?: number }[];
  sort?: SortOption;
  page?: number;
  pageSize?: number;
};

export async function getProducts(query: ProductQuery = {}): Promise<ProductList> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalogue");

  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.featured !== undefined) params.set("featured", String(query.featured));
  if (query.isNew !== undefined) params.set("new", String(query.isNew));
  if (query.sale) params.set("sale", "true");
  if (query.occasion?.length) params.set("occasion", query.occasion.join(","));
  if (query.type?.length) params.set("type", query.type.join(","));
  if (query.color?.length) params.set("color", query.color.join(","));
  if (query.fabric?.length) params.set("fabric", query.fabric.join(","));
  if (query.price?.length) params.set("price", query.price.map((b) => `${b.min ?? ""}-${b.max ?? ""}`).join(","));
  if (query.sort) params.set("sort", query.sort);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));

  return get<ProductList>(`/api/products?${params}`);
}

export async function getCheckoutConfig(): Promise<CheckoutConfig> {
  "use cache";
  cacheLife("minutes");
  return get<CheckoutConfig>("/api/checkout/config");
}

/** Not cached: order status changes and each order is private to its buyer. */
export async function getOrder(id: string): Promise<OrderDetail | null> {
  try {
    return await get<OrderDetail>(`/api/orders/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalogue");
  try {
    return await get<ProductDetail>(`/api/products/${encodeURIComponent(slug)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/** Colours, fabrics and occasions on offer in a listing (for the shop filter sidebar). */
export async function getProductFilters(query: { category?: string; isNew?: boolean; sale?: boolean }): Promise<ProductFilters> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalogue");
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.isNew) params.set("new", "true");
  if (query.sale) params.set("sale", "true");
  return get<ProductFilters>(`/api/products/filters?${params}`);
}

/** Live home-page banners, in order. Admin saves refresh this immediately via the "banners" tag. */
export async function getBanners(): Promise<Banner[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("banners");
  return get<Banner[]>("/api/banners");
}

/**
 * The header or footer menu. Refreshed straight away when the menu is saved ("navigation") or a
 * category changes ("catalogue"), since menus link to categories and follow them until customised.
 */
export async function getNavigation(menu: "header" | "footer"): Promise<NavMenu> {
  "use cache";
  cacheLife("minutes");
  cacheTag("navigation", "catalogue");
  return get<NavMenu>(`/api/navigation/${menu}`);
}

/** The store-wide offer running now (e.g. Black Friday), or null. Shoppers' pages hide it at endsAt. */
export async function getPromotion(): Promise<Promotion | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("promotion");
  return get<Promotion | null>("/api/promotion");
}
