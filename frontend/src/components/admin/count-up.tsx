"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const FORMATS = {
  int: (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n)),
  /** value in paise */
  inr: (n: number) => formatPrice(Math.round(n)),
};

/**
 * Counts up to `value` on first render, and from the previous value to the new one
 * when it changes (e.g. after a data sync). Respects reduced-motion preferences.
 */
export function CountUp({
  value,
  format = "int",
  duration = 2000,
  delay = 300,
}: {
  value: number;
  format?: keyof typeof FORMATS;
  /** ms for the count itself */
  duration?: number;
  /** ms to wait first, so the count starts once its card has risen into place */
  delay?: number;
}) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);
  const first = useRef(true);

  useEffect(() => {
    const start = from.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    // Only wait on the first count; later updates (after a sync) roll immediately.
    const t0 = performance.now() + (first.current && !reduce ? delay : 0);
    first.current = false;

    const tick = (now: number) => {
      const p = reduce ? 1 : Math.min(1, Math.max(0, now - t0) / duration);
      const current = start + (value - start) * easeOutCubic(p);
      setDisplay(current);
      if (p < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      // If interrupted mid-count, the next animation starts from the final target.
      from.current = value;
    };
  }, [value, duration, delay]);

  return (
    <span className="tabular-nums" aria-label={FORMATS[format](value)}>
      <span aria-hidden>{FORMATS[format](display)}</span>
    </span>
  );
}
