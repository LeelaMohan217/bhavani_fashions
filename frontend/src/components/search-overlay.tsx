"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, Search, X } from "lucide-react";
import { searchProducts } from "@/lib/store-actions";
import type { ProductCard } from "@/lib/types";
import { formatPrice } from "@/lib/format";

type Results = { query: string; items: ProductCard[]; total: number };

export function SearchButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" aria-label="Search" onClick={() => setOpen(true)} className={className}>
        <Search className="size-[1.15rem]" strokeWidth={1.5} />
      </button>
      {/* Portalled to <body> so the fixed panel covers the whole page */}
      {open && createPortal(<SearchPanel onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

/** Phones: a full-width search field under the navbar. Tapping it opens search, ready to type. */
export function SearchBar({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-11 w-full items-center gap-2.5 rounded-lg bg-sand px-3.5 text-left text-sm text-stone transition-colors active:bg-line ${className}`}
      >
        <Search className="size-4 shrink-0" strokeWidth={1.75} />
        <span className="truncate">Search sarees, lehengas, kurta sets</span>
      </button>
      {open && createPortal(<SearchPanel onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

/**
 * Minimal search: one slim line over the header (icon, underlined input, close). Nothing else
 * shows until the shopper types; then a single column of matching pieces appears below.
 */
function SearchPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);
  const trimmed = query.trim();

  // Lock page scroll and close on Escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Debounced live search; stale responses are ignored
  useEffect(() => {
    if (trimmed.length < 2) return;
    const id = ++latest.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await searchProducts(trimmed);
      if (id !== latest.current) return;
      setResults({ query: trimmed, ...res });
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [trimmed]);

  const showResults = trimmed.length >= 2 && results;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Search">
      <div onClick={onClose} className="absolute inset-0 hidden animate-fade-in bg-ink/25 md:block" />
      {/* Phones: full screen. Larger screens: a slim strip over the header that grows to fit results. */}
      <div className="relative flex h-[100dvh] animate-fade-in flex-col bg-canvas md:h-auto md:max-h-[80dvh] md:shadow-[0_20px_40px_-24px_rgb(17_17_17/0.35)]">
        <div className="container-x shrink-0">
          <div className="flex h-[4.5rem] items-center gap-3 border-b border-ink">
            {loading ? (
              <LoaderCircle className="size-[1.15rem] shrink-0 animate-spin text-stone" strokeWidth={1.5} />
            ) : (
              <Search className="size-[1.15rem] shrink-0 text-ink" strokeWidth={1.5} />
            )}
            <label htmlFor="site-search" className="sr-only">Search the store</label>
            <input
              id="site-search"
              type="search"
              autoFocus
              autoComplete="off"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sarees, lehengas, kurta sets"
              className="h-full min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-stone focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            <button
              type="button"
              aria-label="Close search"
              onClick={onClose}
              className="-mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand"
            >
              <X className="size-[1.15rem]" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {showResults && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-live="polite">
            <div className="container-x pb-6 pt-2">
              {results.items.length === 0 ? (
                <p className="py-6 text-sm text-stone">No pieces match &ldquo;{results.query}&rdquo;</p>
              ) : (
                <ul>
                  {results.items.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/products/${p.slug}`}
                        onClick={onClose}
                        className="group -mx-2 flex items-center gap-4 rounded-md px-2 py-2.5 transition-colors hover:bg-sand"
                      >
                        <span className="relative aspect-[3/4] w-10 shrink-0 overflow-hidden bg-sand">
                          {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-ink">{p.name}</span>
                          <span className="block truncate text-xs text-stone">
                            {[p.category.name, p.fabric].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm tabular-nums text-ink">{formatPrice(p.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
