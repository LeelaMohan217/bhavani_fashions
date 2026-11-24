"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { SortOption } from "@/lib/types";

const OPTIONS: { value: SortOption; label: string }[] = [
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
    <label className={`relative inline-flex items-center gap-2 ${pending ? "opacity-60" : ""}`}>
      <span className="eyebrow text-stone">Sort</span>
      <select
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams);
          params.set("sort", e.target.value);
          params.delete("page");
          startTransition(() => router.replace(`${pathname}?${params}`, { scroll: false }));
        }}
        className="eyebrow cursor-pointer appearance-none bg-transparent py-2 pl-1 pr-6 text-ink focus:outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 size-3.5" strokeWidth={1.5} />
    </label>
  );
}
