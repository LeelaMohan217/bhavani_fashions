// The last order this browser placed or looked up (no customer accounts yet), so the
// mobile menu can offer a one-tap "track your order" link.
import { useSyncExternalStore } from "react";

export type RecentOrder = { id: string; number: string };

const KEY = "bf_recent_order";
const EVENT = "bf-recent-order";

let cachedRaw: string | null = null;
let cached: RecentOrder | null = null;

function read(): RecentOrder | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cached;
  }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    cached = parsed && typeof parsed.id === "string" && typeof parsed.number === "string" ? parsed : null;
  } catch {
    cached = null;
  }
  return cached;
}

export function rememberOrder(order: RecentOrder) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ id: order.id, number: order.number }));
  } catch {
    // storage blocked: the menu falls back to the track-order form
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useRecentOrder() {
  return useSyncExternalStore(subscribe, read, () => null);
}
