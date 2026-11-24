// Wishlist saved in this browser (no customer accounts yet). Each entry is a product-card
// snapshot so the wishlist page renders without another API call. Prices can go stale;
// the product page always shows the live price.
import { useSyncExternalStore } from "react";
import type { ProductCard } from "./types";

const KEY = "bf_wishlist";
const EMPTY: ProductCard[] = [];
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cached: ProductCard[] = EMPTY;

function read(): ProductCard[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cached; // storage blocked (private mode, etc.): keep the in-memory list
  }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cached = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function write(items: ProductCard[]) {
  cached = items;
  try {
    cachedRaw = JSON.stringify(items);
    localStorage.setItem(KEY, cachedRaw);
  } catch {
    // ignore: the list still works for this visit
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep other tabs in sync
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const noop = () => () => {};

/** False during server render and hydration, true once the browser's saved list can be read. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

export function useWishlist() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    items,
    has: (id: string) => items.some((p) => p.id === id),
    toggle: (product: ProductCard) => {
      const current = read();
      write(
        current.some((p) => p.id === product.id)
          ? current.filter((p) => p.id !== product.id)
          : [product, ...current],
      );
    },
    remove: (id: string) => write(read().filter((p) => p.id !== id)),
  };
}
