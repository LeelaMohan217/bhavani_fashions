"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LoaderCircle, Search, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/content";
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

const SUGGESTIONS = ["Silk", "Banarasi", "Bridal", "Red", "Cotton", "Chikankari"];

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
      <div onClick={onClose} className="absolute inset-0 hidden animate-fade-in bg-ink/30 md:block" />
      {/* Phones: full screen. Larger screens: a panel dropping from the top. */}
      <div className="relative h-[100dvh] animate-fade-in overflow-y-auto bg-canvas md:h-auto md:max-h-[85dvh] md:shadow-[0_24px_48px_-24px_rgb(17_17_17/0.35)]">
        <div className="container-x pb-10 pt-3 md:pb-12 md:pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg bg-sand px-3.5 focus-within:ring-1 focus-within:ring-ink md:h-12">
              {loading ? (
                <LoaderCircle className="size-4 shrink-0 animate-spin text-stone" strokeWidth={1.75} />
              ) : (
                <Search className="size-4 shrink-0 text-stone" strokeWidth={1.75} />
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
                placeholder="Search sarees, lehengas…"
                className="h-full min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-stone focus:outline-none md:text-sm [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="-mr-1.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-stone hover:text-ink"
                >
                  <X className="size-4" strokeWidth={1.75} />
                </button>
              )}
            </div>
            <button type="button" onClick={onClose} className="shrink-0 text-sm text-ink-soft hover:text-ink">
              Cancel
            </button>
          </div>

          {!showResults ? (
            <div className="mt-7 space-y-7">
              <div>
                <p className="text-xs text-stone">Try searching</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((term) => (
                    <li key={term}>
                      <button
                        type="button"
                        onClick={() => setQuery(term)}
                        className="border border-line px-3.5 py-1.5 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink"
                      >
                        {term}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-stone">Shop by category</p>
                <ul className="mt-1 divide-y divide-line">
                  {NAV_LINKS.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} onClick={onClose} className="flex items-center justify-between py-3 text-sm text-ink">
                        {l.label}
                        <ArrowRight className="size-4 text-stone" strokeWidth={1.5} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : results.items.length === 0 ? (
            <div className="mt-10 text-center md:mt-14">
              <p className="text-base text-ink">No pieces match &ldquo;{results.query}&rdquo;</p>
              <p className="mt-2 text-sm text-stone">Try a fabric, a colour or an occasion, like silk, red or bridal.</p>
            </div>
          ) : (
            <div className="mt-6" aria-live="polite">
              <p className="text-xs text-stone">
                {results.total > results.items.length
                  ? `Showing ${results.items.length} of ${results.total} pieces`
                  : `${results.total} ${results.total === 1 ? "piece" : "pieces"}`}
              </p>
              <ul className="mt-4 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                {results.items.map((p) => (
                  <li key={p.id} className="border-b border-line">
                    <Link href={`/products/${p.slug}`} onClick={onClose} className="group flex items-center gap-3.5 py-3">
                      <span className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden bg-sand">
                        {p.images[0] && (
                          <Image src={p.images[0].url} alt="" fill sizes="48px" className="object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink group-hover:underline">{p.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-stone">
                          {[p.category.name, p.fabric].filter(Boolean).join(" · ")}
                        </span>
                        <span className="mt-1 block text-sm tabular-nums">{formatPrice(p.price)}</span>
                      </span>
                      <ArrowRight
                        className="size-4 shrink-0 text-stone opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100"
                        strokeWidth={1.5}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
