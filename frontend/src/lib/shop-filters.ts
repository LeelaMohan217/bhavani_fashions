// Shop filters as they appear in links: /shop/sarees?price=0-3000,3000-5000&occasion=Festive&color=Rose
// Shared by the listing page (server), the sidebar and the phone filter sheet (client).
import { PRICE_RANGES } from "./content";
import type { SortOption } from "./types";

export type FilterKey = "price" | "occasion" | "color" | "fabric";
export type Selection = Record<FilterKey, string[]>;

export const FILTER_KEYS: FilterKey[] = ["price", "occasion", "color", "fabric"];
export const EMPTY_SELECTION: Selection = { price: [], occasion: [], color: [], fabric: [] };

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

const read = (sp: Params, key: string) => {
  const v = sp instanceof URLSearchParams ? sp.get(key) : sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? undefined;
};

const list = (v: string | undefined) =>
  v ? [...new Set(v.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 20) : [];

/** Reads the selected filters from a page's search params (unknown price bands are dropped). */
export function parseSelection(sp: Params): Selection {
  const price = list(read(sp, "price")).filter((k) => PRICE_RANGES.some((r) => r.key === k));
  // Older "Shop by price" links: ?min=3000&max=5000
  const min = read(sp, "min");
  const max = read(sp, "max");
  if (min || max) {
    const legacy = PRICE_RANGES.find((r) => String(r.min ?? "") === (min ?? "") && String(r.max ?? "") === (max ?? ""));
    if (legacy && !price.includes(legacy.key)) price.push(legacy.key);
  }
  return {
    price,
    occasion: list(read(sp, "occasion")),
    color: list(read(sp, "color")),
    fabric: list(read(sp, "fabric")),
  };
}

export const selectionCount = (s: Selection) => FILTER_KEYS.reduce((n, k) => n + s[k].length, 0);

/** Price bands (rupees in the link) → paise bounds for the API */
export const priceBandsInPaise = (keys: string[]) =>
  PRICE_RANGES.filter((r) => keys.includes(r.key)).map((r) => ({
    min: r.min === undefined ? undefined : r.min * 100,
    max: r.max === undefined ? undefined : r.max * 100,
  }));

/** Builds a listing link for a selection; page resets to 1 whenever filters change. */
export function listingHref(
  path: string,
  s: Selection,
  keep: { filter?: string; sort?: SortOption; page?: number } = {},
) {
  const params = new URLSearchParams();
  if (keep.filter) params.set("filter", keep.filter);
  for (const k of FILTER_KEYS) if (s[k].length) params.set(k, s[k].join(","));
  if (keep.sort && keep.sort !== "featured") params.set("sort", keep.sort);
  if (keep.page && keep.page > 1) params.set("page", String(keep.page));
  const qs = params.toString().replace(/%2C/g, ",");
  return `${path}${qs ? `?${qs}` : ""}`;
}
