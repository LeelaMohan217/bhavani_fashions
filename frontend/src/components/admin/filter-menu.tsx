"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, SlidersHorizontal } from "lucide-react";

export type FilterSection = {
  label: string;
  options: { label: string; href: string; active: boolean }[];
};

/** A compact "Filter" button that opens a small menu of link-based filter options. */
export function FilterMenu({ sections, activeCount, clearHref }: { sections: FilterSection[]; activeCount: number; clearHref: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
          activeCount ? "border-neutral-900 text-neutral-900" : "border-neutral-200 text-neutral-600 hover:text-neutral-900"
        }`}
      >
        <SlidersHorizontal className="size-3.5" />
        Filter
        {activeCount > 0 && <span className="rounded bg-neutral-900 px-1 text-[0.65rem] tabular-nums text-white">{activeCount}</span>}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-52 rounded-md border border-neutral-200 bg-white py-1 text-xs shadow-lg">
          {sections.map((s) => (
            <div key={s.label} className="py-0.5">
              <p className="px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-neutral-400">{s.label}</p>
              {s.options.map((o) => (
                <Link
                  key={o.href}
                  href={o.href}
                  onClick={() => setOpen(false)}
                  aria-current={o.active ? "true" : undefined}
                  className={`flex items-center justify-between px-3 py-1.5 hover:bg-neutral-50 ${o.active ? "font-medium text-neutral-900" : "text-neutral-600"}`}
                >
                  {o.label}
                  {o.active && <Check className="size-3.5" />}
                </Link>
              ))}
            </div>
          ))}
          {activeCount > 0 && (
            <Link href={clearHref} onClick={() => setOpen(false)} className="mt-0.5 block border-t border-neutral-100 px-3 py-1.5 text-neutral-500 hover:text-neutral-900">
              Clear filters
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
