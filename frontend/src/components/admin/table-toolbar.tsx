"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Download, ListFilter, LoaderCircle, Search, X } from "lucide-react";
import { btn } from "./ui";

/** Toolbar buttons: same 2rem height as the search field (btn.secondary is 2.25rem) */
const toolBtn =
  "inline-flex h-8 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 shadow-xs transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

export type FilterGroup = {
  /** URL search param this group controls, e.g. "payment" */
  param: string;
  label: string;
  options: { value: string; label: string; count?: number }[];
};

/**
 * Toolbar that sits inside a table card: search + Filter on the left, Export on the right.
 * Everything is driven by URL params, so filters survive refresh and are included in exports.
 */
export function TableToolbar({
  searchPlaceholder,
  filters,
  exportPath,
}: {
  searchPlaceholder: string;
  filters: FilterGroup[];
  /** Route handler that returns a CSV for the current params */
  exportPath: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    mutate(next);
    next.delete("page");
    start(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };

  const activeCount = filters.reduce((n, f) => n + selectedOf(params, f.param).length, 0);
  const exportHref = `${exportPath}${params.size ? `?${params}` : ""}`;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 p-3">
      <SearchField placeholder={searchPlaceholder} pending={pending} onSearch={(v) => update((p) => (v ? p.set("search", v) : p.delete("search")))} initial={params.get("search") ?? ""} />

      <FilterMenu filters={filters} params={params} activeCount={activeCount} update={update} />

      <a href={exportHref} download className={`${toolBtn} ml-auto`}>
        <Download className="size-3.5" />
        Export
      </a>
    </div>
  );
}

function SearchField({
  placeholder,
  initial,
  pending,
  onSearch,
}: {
  placeholder: string;
  initial: string;
  pending: boolean;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
      className="relative w-full sm:w-72"
    >
      {pending ? (
        <LoaderCircle className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-neutral-400" />
      ) : (
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
      )}
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-8 w-full rounded-md border border-neutral-200 bg-white pl-8 pr-7 text-sm placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setValue("");
            onSearch("");
          }}
          className="absolute right-1.5 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded text-neutral-400 hover:text-neutral-900"
        >
          <X className="size-3.5" />
        </button>
      )}
    </form>
  );
}

function FilterMenu({
  filters,
  params,
  activeCount,
  update,
}: {
  filters: FilterGroup[];
  params: URLSearchParams;
  activeCount: number;
  update: (mutate: (p: URLSearchParams) => void) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${toolBtn} ${open ? "bg-neutral-50" : ""}`}
      >
        <ListFilter className="size-3.5" />
        Filter
        {activeCount > 0 && (
          <span className="rounded-full bg-neutral-900 px-1.5 text-[0.65rem] font-semibold tabular-nums leading-4 text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Filters" className="absolute left-0 top-full z-30 mt-1.5 w-56 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
          <div className="max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain p-1">
            {filters.map((group) => (
              <FilterSection key={group.param} group={group} selected={selectedOf(params, group.param)} update={update} />
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-neutral-100 bg-neutral-50 px-2 py-1.5">
            <span className="pl-1 text-[0.7rem] text-neutral-500">
              {activeCount > 0 ? `${activeCount} selected` : "No filters"}
            </span>
            <button
              type="button"
              disabled={activeCount === 0}
              onClick={() => update((p) => filters.forEach((f) => p.delete(f.param)))}
              // Filled when there's something to clear; quiet text button otherwise
              className={`${btn.base} h-6 px-2 text-[0.7rem] ${
                activeCount > 0 ? "bg-neutral-900 text-white hover:bg-neutral-700" : "text-neutral-400"
              }`}
            >
              <X className="size-3" />
              Clear filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Values selected for a multi-select param ("a,b" → ["a", "b"]) */
const selectedOf = (params: URLSearchParams, param: string) =>
  (params.get(param) ?? "").split(",").map((v) => v.trim()).filter(Boolean);

/** Collapsible group of checkboxes; opens by default when something in it is selected. */
function FilterSection({
  group,
  selected,
  update,
}: {
  group: FilterGroup;
  selected: string[];
  update: (mutate: (p: URLSearchParams) => void) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const toggle = (value: string) =>
    update((p) => {
      const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
      if (next.length) p.set(group.param, next.join(","));
      else p.delete(group.param);
    });

  return (
    <div className="[&+&]:mt-1 [&+&]:border-t [&+&]:border-neutral-100 [&+&]:pt-1">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-neutral-50"
      >
        <span className="flex-1 text-[0.625rem] font-semibold uppercase tracking-wider text-neutral-500">{group.label}</span>
        {selected.length > 0 && (
          <span className="rounded-full bg-neutral-900 px-1.5 text-[0.6rem] font-semibold tabular-nums leading-4 text-white">
            {selected.length}
          </span>
        )}
        <ChevronDown className={`size-3.5 text-neutral-400 transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`} />
      </button>

      {expanded && (
        <ul className="pb-1">
          {group.options.map((o) => {
            const on = selected.includes(o.value);
            const id = `f-${group.param}-${o.value}`;
            return (
              <li key={o.value}>
                <label
                  htmlFor={id}
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-neutral-100 ${on ? "text-neutral-900" : "text-neutral-600"}`}
                >
                  <input id={id} type="checkbox" checked={on} onChange={() => toggle(o.value)} className="peer sr-only" />
                  {/* Custom checkbox that matches the admin's neutral style */}
                  <span
                    aria-hidden
                    className={`flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-900/20 ${
                      on ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white"
                    }`}
                  >
                    {on && <Check className="size-2.5" strokeWidth={3.5} />}
                  </span>
                  <span className="flex-1">{o.label}</span>
                  {o.count !== undefined && o.count > 0 && (
                    <span className="text-[0.65rem] tabular-nums text-neutral-400">{o.count}</span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
