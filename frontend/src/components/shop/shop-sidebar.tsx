"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ProductFilters, SortOption } from "@/lib/types";
import { EMPTY_SELECTION, listingHref, selectionCount, type FilterKey, type Selection } from "@/lib/shop-filters";
import { FilterPanel, toggleOption } from "./filter-panel";

/** Desktop filter sidebar: each tick updates the results straight away. */
export function ShopSidebar({
  filters,
  selection,
  filter,
  sort,
}: {
  filters: ProductFilters;
  selection: Selection;
  /** "new" / "sale" listings keep that scope while filtering */
  filter?: string;
  sort: SortOption;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  // Ticks show instantly while the new results load
  const [value, setValue] = useOptimistic(selection);

  const go = (next: Selection) =>
    startTransition(() => {
      setValue(next);
      router.replace(listingHref(pathname, next, { filter, sort }), { scroll: false });
    });

  const count = selectionCount(value);

  return (
    <div aria-busy={pending}>
      <div className="flex h-8 items-center justify-between">
        <p className="eyebrow text-ink">Filters</p>
        {count > 0 && (
          <button type="button" onClick={() => go(EMPTY_SELECTION)} className="cursor-pointer text-xs text-stone underline underline-offset-4 transition-colors hover:text-ink">
            Clear all ({count})
          </button>
        )}
      </div>
      <div className="mt-2">
        <FilterPanel filters={filters} value={value} onToggle={(k: FilterKey, o: string) => go(toggleOption(value, k, o))} />
      </div>
    </div>
  );
}
