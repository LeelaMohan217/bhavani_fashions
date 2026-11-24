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
      {/* Portalled to <body>: the header's backdrop-filter would otherwise trap this fixed panel inside it */}
      {open && createPortal(<SearchPanel onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

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
      <div onClick={onClose} className="absolute inset-0 animate-fade-in bg-ink/30" />
      <div className="relative max-h-[100dvh] animate-fade-in overflow-y-auto bg-canvas shadow-[0_24px_48px_-24px_rgb(17_17_17/0.35)]">
        <div className="container-x pb-10 pt-5 md:pb-14 md:pt-8">
          <div className="flex items-center gap-3 border-b border-ink pb-3">
            {loading ? (
              <LoaderCircle className="size-5 shrink-0 animate-spin text-stone" strokeWidth={1.5} />
            ) : (
              <Search className="size-5 shrink-0 text-stone" strokeWidth={1.5} />
            )}
            <label htmlFor="site-search" className="sr-only">Search the store</label>
            <input
              id="site-search"
              type="search"
              autoFocus
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sarees, silk, red, bridal…"
              className="display min-w-0 flex-1 bg-transparent text-2xl placeholder:text-stone/60 focus:outline-none md:text-4xl [&::-webkit-search-cancel-button]:hidden"
            />
            <button
              type="button"
              aria-label="Close search"
              onClick={onClose}
              className="-mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-sand"
            >
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </div>

          {!showResults ? (
            <div className="mt-8">
              <p className="eyebrow text-stone">Browse</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={onClose}
                      className="eyebrow inline-block rounded-full border border-line px-4 py-2 text-[0.625rem] transition-colors hover:border-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : results.items.length === 0 ? (
            <div className="mt-10 text-center md:mt-14">
              <p className="display text-2xl">No pieces match &ldquo;{results.query}&rdquo;</p>
              <p className="mt-2 text-sm text-stone">Try a fabric, a colour or an occasion, like silk, red or bridal.</p>
            </div>
          ) : (
            <div className="mt-8" aria-live="polite">
              <p className="eyebrow text-stone">
                {results.total > results.items.length
                  ? `Showing ${results.items.length} of ${results.total} pieces`
                  : `${results.total} ${results.total === 1 ? "piece" : "pieces"}`}
              </p>
              <ul className="mt-4 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                {results.items.map((p) => (
                  <li key={p.id} className="border-b border-line">
                    <Link href={`/products/${p.slug}`} onClick={onClose} className="group flex items-center gap-4 py-4">
                      <span className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden bg-sand">
                        {p.images[0] && (
                          <Image src={p.images[0].url} alt="" fill sizes="56px" className="object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-base group-hover:text-clay">{p.name}</span>
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
