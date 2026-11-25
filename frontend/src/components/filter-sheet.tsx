"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { Check, SlidersHorizontal, X } from "lucide-react";
import type { ProductFilters, SortOption } from "@/lib/types";
import { EMPTY_SELECTION, listingHref, selectionCount, type Selection } from "@/lib/shop-filters";
import { FilterPanel, toggleOption } from "./shop/filter-panel";
import { SORT_OPTIONS } from "./sort-select";

/**
 * Phones and tablets: piece count + Filter button. The sheet holds the same filters as the
 * desktop sidebar plus sort; nothing changes until "Show results".
 */
export function FilterSheet({
  filters,
  selection,
  filter,
  sort,
  total,
}: {
  filters: ProductFilters;
  selection: Selection;
  filter?: string;
  sort: SortOption;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Selection>(selection);
  const [sortBy, setSortBy] = useState<SortOption>(sort);

  const openSheet = () => {
    setDraft(selection);
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
    setOpen(false);
    startTransition(() => router.push(listingHref(pathname, draft, { filter, sort: sortBy }), { scroll: false }));
  };

  // Shown on the button: filters ticked, plus one if the order isn't the default
  const activeCount = selectionCount(selection) + (sort !== "featured" ? 1 : 0);

  return (
    <div className="flex w-full items-center justify-between gap-3">
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
        Filter &amp; sort
        {activeCount > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-ink text-[0.6rem] tracking-normal text-canvas">
            {activeCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filter and sort">
            <div onClick={() => setOpen(false)} className="absolute inset-0 animate-fade-in bg-ink/30" />
            <div className="absolute inset-x-0 bottom-0 flex max-h-[88svh] animate-sheet-up flex-col rounded-t-2xl bg-canvas pb-[env(safe-area-inset-bottom)] md:inset-x-auto md:inset-y-0 md:right-0 md:max-h-none md:w-[24rem] md:rounded-none">
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

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4">
                <fieldset className="mt-2">
                  <legend className="eyebrow text-stone">Sort by</legend>
                  <ul className="mt-1">
                    {SORT_OPTIONS.map((o) => {
                      const active = sortBy === o.value;
                      return (
                        <li key={o.value}>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setSortBy(o.value)}
                            className={`flex w-full items-center justify-between py-2.5 text-left text-sm ${
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

                <div className="mt-6">
                  <FilterPanel filters={filters} value={draft} onToggle={(k, o) => setDraft((d) => toggleOption(d, k, o))} />
                </div>
              </div>

              <div className="flex gap-3 border-t border-line px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(EMPTY_SELECTION);
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
