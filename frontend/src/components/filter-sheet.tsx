"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, SlidersHorizontal, X } from "lucide-react";
import type { SortOption } from "@/lib/types";
import { SORT_OPTIONS } from "./sort-select";

type Category = { slug: string; name: string };

/** "all", "new" or a category slug */
type Show = string;

/** Phone-only filter button + bottom sheet with category and sort options. */
export function FilterSheet({
  categories,
  categorySlug,
  onlyNew,
  sort,
  total,
}: {
  categories: Category[];
  categorySlug?: string;
  onlyNew: boolean;
  sort: SortOption;
  total: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const current: Show = categorySlug ?? (onlyNew ? "new" : "all");
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState<Show>(current);
  const [sortBy, setSortBy] = useState<SortOption>(sort);

  const openSheet = () => {
    setShow(current);
    setSortBy(sort);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const apply = () => {
    const params = new URLSearchParams();
    if (show === "new") params.set("filter", "new");
    if (sortBy !== "featured") params.set("sort", sortBy);
    const path = show === "all" || show === "new" ? "/shop" : `/shop/${show}`;
    const qs = params.toString();
    setOpen(false);
    startTransition(() => router.push(`${path}${qs ? `?${qs}` : ""}`));
  };

  // Count of choices that differ from the default view, shown on the button
  const activeCount = (current !== "all" ? 1 : 0) + (sort !== "featured" ? 1 : 0);

  const showOptions: { value: Show; label: string }[] = [
    { value: "all", label: "All" },
    ...categories.map((c) => ({ value: c.slug, label: c.name })),
    { value: "new", label: "New in" },
  ];

  return (
    <div className="flex w-full items-center justify-between gap-3 md:hidden">
      <p className={`eyebrow text-stone ${pending ? "opacity-60" : ""}`}>
        {total} {total === 1 ? "piece" : "pieces"}
      </p>
      <button
        type="button"
        onClick={openSheet}
        aria-haspopup="dialog"
        className="eyebrow inline-flex items-center gap-2 rounded-full border border-ink px-4 py-2 text-[0.625rem] text-ink"
      >
        <SlidersHorizontal className="size-3.5" strokeWidth={1.5} />
        Filter
        {activeCount > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-ink text-[0.6rem] tracking-normal text-canvas">
            {activeCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Filter and sort">
            <div onClick={() => setOpen(false)} className="absolute inset-0 animate-fade-in bg-ink/30" />
            <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] animate-sheet-up flex-col rounded-t-2xl bg-canvas pb-[env(safe-area-inset-bottom)]">
              <div className="flex items-center justify-between px-6 pb-2 pt-5">
                <span className="eyebrow text-ink">Filter &amp; sort</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  autoFocus
                  className="-mr-2 inline-flex size-10 items-center justify-center rounded-full hover:bg-sand"
                >
                  <X className="size-5" strokeWidth={1.5} />
                </button>
              </div>

              <div className="overflow-y-auto px-6 pb-4">
                <fieldset className="mt-3">
                  <legend className="eyebrow text-stone">Show</legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {showOptions.map((o) => {
                      const active = show === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setShow(o.value)}
                          className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                            active ? "border-ink bg-ink text-canvas" : "border-line text-ink-soft"
                          }`}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset className="mt-8">
                  <legend className="eyebrow text-stone">Sort by</legend>
                  <ul className="mt-2">
                    {SORT_OPTIONS.map((o) => {
                      const active = sortBy === o.value;
                      return (
                        <li key={o.value}>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setSortBy(o.value)}
                            className={`flex w-full items-center justify-between py-3 text-left text-sm ${
                              active ? "font-medium text-ink" : "text-ink-soft"
                            }`}
                          >
                            {o.label}
                            {active && <Check className="size-4" strokeWidth={1.75} />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              </div>

              <div className="flex gap-3 border-t border-line px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setShow("all");
                    setSortBy("featured");
                  }}
                  className="eyebrow flex-1 border border-line py-4 text-ink"
                >
                  Clear
                </button>
                <button type="button" onClick={apply} className="eyebrow flex-[2] bg-ink py-4 text-canvas">
                  Show results
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
