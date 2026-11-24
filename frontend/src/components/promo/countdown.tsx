"use client";

import { useSyncExternalStore } from "react";

// One shared 1-second clock for every countdown on the page
const subscribe = (cb: () => void) => {
  const id = window.setInterval(cb, 1000);
  return () => window.clearInterval(id);
};
const nowSeconds = () => Math.floor(Date.now() / 1000);

/**
 * Time left until `endsAt`. Null on the server and the first paint (so the server HTML never
 * disagrees with the shopper's clock); `ended` turns true the second the offer finishes.
 */
export function useCountdown(endsAt: string) {
  const now = useSyncExternalStore(subscribe, nowSeconds, () => null);
  if (now === null) return null;
  const left = Math.max(0, Math.floor(new Date(endsAt).getTime() / 1000) - now);
  return {
    ended: left === 0,
    days: Math.floor(left / 86400),
    hours: Math.floor(left / 3600) % 24,
    minutes: Math.floor(left / 60) % 60,
    seconds: left % 60,
  };
}

export const pad = (n: number) => String(n).padStart(2, "0");

/** "Friday 27 November" in India time */
export const endDay = (endsAt: string) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(new Date(endsAt));
