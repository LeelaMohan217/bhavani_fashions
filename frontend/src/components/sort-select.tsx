"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { SortOption } from "@/lib/types";
import { Select } from "./ui/select";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export function SortSelect({ value }: { value: SortOption }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <div className={`inline-flex items-center gap-2 ${pending ? "opacity-60" : ""}`}>
      <span className="eyebrow text-stone" id="sort-label">Sort</span>
      <Select
        value={value}
        options={SORT_OPTIONS}
        minListWidth={208}
        onChange={(v) => {
          const params = new URLSearchParams(searchParams);
          params.set("sort", v);
          params.delete("page");
          startTransition(() => router.replace(`${pathname}?${params}`, { scroll: false }));
        }}
        className="eyebrow inline-flex items-center gap-2 py-2 pl-1 text-ink"
      >
        {(selected, open) => (
          <>
            <span aria-labelledby="sort-label">{selected?.label}</span>
            <ChevronDown className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} strokeWidth={1.5} />
          </>
        )}
      </Select>
    </div>
  );
}
