"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CornerDownLeft,
  ExternalLink,
  FolderTree,
  GalleryHorizontalEnd,
  History,
  LifeBuoy,
  PackageCheck,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  Shirt,
  TrendingUp,
} from "lucide-react";

// ─── Recent searches (per browser) ───────────────────────────────────────────
type Scope = "orders" | "products";
type RecentSearch = { term: string; scope: Scope };
const RECENT_KEY = "bf-admin-recent-searches";
const MAX_RECENT = 5;

function loadRecent(): RecentSearch[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(list: RecentSearch[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    // Storage unavailable — recents just won't persist.
  }
}

const searchHref = (scope: Scope, term: string) => `/admin/${scope}?search=${encodeURIComponent(term)}`;

/** Stops the page behind the palette from scrolling (pads for the scrollbar). */
function lockPageScroll() {
  const html = document.documentElement;
  const scrollbar = window.innerWidth - html.clientWidth;
  const prev = { overflow: html.style.overflow, paddingRight: html.style.paddingRight };
  html.style.overflow = "hidden";
  if (scrollbar > 0) html.style.paddingRight = `${scrollbar}px`;
  return () => {
    html.style.overflow = prev.overflow;
    html.style.paddingRight = prev.paddingRight;
  };
}

type Item = {
  id: string;
  title: React.ReactNode;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
  run: () => void;
};

type Section = { title: string; items: Item[]; action?: React.ReactNode };

// ─── Trigger (lives in the top bar) ──────────────────────────────────────────

/** Looks like a search field; opens the palette on click, "/" or Ctrl/⌘+K. */
export function CommandPalette({ toFulfil }: { toFulfil: number }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Same width as two KPI cards on the dashboard (4-column grid with a 1rem gap ⇒ 50% − 0.5rem) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="Search orders, products, pages and actions"
        className="group relative flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 pl-2.5 pr-2 text-left text-sm text-neutral-400 transition-colors hover:border-neutral-300 hover:bg-white sm:max-w-sm xl:max-w-[calc(50%-0.5rem)]"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate">Search…</span>
        <span className="hidden items-center gap-1 sm:flex">
          <Kbd>/</Kbd>
          <span className="text-[0.65rem]">or</span>
          <Kbd>Ctrl K</Kbd>
        </span>
      </button>

      {open && <Palette toFulfil={toFulfil} onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── The palette itself ──────────────────────────────────────────────────────

function Palette({ toFulfil, onClose }: { toFulfil: number; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<RecentSearch[]>(loadRecent);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => lockPageScroll(), []);

  const term = q.trim();
  const lower = term.toLowerCase();

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const remember = (entry: RecentSearch) => {
    const next = [
      entry,
      ...recent.filter((r) => !(r.term.toLowerCase() === entry.term.toLowerCase() && r.scope === entry.scope)),
    ].slice(0, MAX_RECENT);
    setRecent(next);
    saveRecent(next);
  };

  const sections = useMemo<Section[]>(() => {
    const looksLikeOrder = /^(bf)?\d{4,}$/i.test(term.replace(/\s/g, ""));
    const scopes: Scope[] = looksLikeOrder ? ["orders", "products"] : ["products", "orders"];

    const searchItems: Item[] = term
      ? scopes.map((scope) => ({
          id: `search-${scope}`,
          icon: scope === "orders" ? Receipt : Shirt,
          title: (
            <>
              Search {scope} for <span className="font-semibold">“{term}”</span>
            </>
          ),
          subtitle: scope === "orders" ? "Order number, customer name or phone" : "Product name or SKU",
          run: () => {
            remember({ term, scope });
            go(searchHref(scope, term));
          },
        }))
      : [];

    const recentItems: Item[] = term
      ? []
      : recent.map((r) => ({
          id: `recent-${r.scope}-${r.term}`,
          icon: History,
          title: r.term,
          subtitle: `in ${r.scope}`,
          run: () => {
            remember(r);
            go(searchHref(r.scope, r.term));
          },
        }));

    const actions: Item[] = [
      {
        id: "a-new-product",
        icon: Plus,
        title: "Add a product",
        subtitle: "Saree, lehenga or kurta set",
        keywords: "new create add product saree lehenga kurta",
        run: () => go("/admin/products/new"),
      },
      {
        id: "a-ship",
        icon: PackageCheck,
        title: "Pack & ship orders",
        subtitle: toFulfil > 0 ? `${toFulfil} ${toFulfil === 1 ? "order is" : "orders are"} waiting` : "Nothing waiting right now",
        keywords: "ship pack fulfil fulfill pending courier tracking",
        run: () => go("/admin/orders?status=to-fulfil"),
      },
      {
        id: "a-sync",
        icon: RefreshCw,
        title: "Sync data",
        subtitle: "Refresh numbers, orders and alerts",
        keywords: "sync refresh reload update",
        run: () => {
          onClose();
          router.refresh();
        },
      },
      {
        id: "a-store",
        icon: ExternalLink,
        title: "View store",
        subtitle: "Opens the shop in a new tab",
        keywords: "store shop website preview open",
        run: () => {
          onClose();
          window.open("/", "_blank", "noopener");
        },
      },
    ];

    const pages: Item[] = [
      { id: "p-orders", icon: Receipt, title: "Orders", subtitle: "All orders and their status", keywords: "orders sales customers", run: () => go("/admin/orders") },
      { id: "p-products", icon: Shirt, title: "Products", subtitle: "Catalogue, prices and stock", keywords: "products catalogue sarees lehengas stock inventory", run: () => go("/admin/products") },
      { id: "p-low-stock", icon: PackageCheck, title: "Low stock", subtitle: "Sold-out and nearly gone variants", keywords: "low stock inventory sold out restock running out variants", run: () => go("/admin/low-stock") },
      { id: "p-insights", icon: TrendingUp, title: "Best sellers", subtitle: "Top products this month, last month and all time", keywords: "best sellers top selling products insights report analytics sales popular", run: () => go("/admin/insights") },
      { id: "p-categories", icon: FolderTree, title: "Categories", subtitle: "Categories and subcategories", keywords: "categories subcategories sarees lehengas kurta sets groups types collections", run: () => go("/admin/categories") },
      { id: "p-banners", icon: GalleryHorizontalEnd, title: "Banners & offers", subtitle: "Home-page banners and store-wide sales", keywords: "banners home page offers slideshow hero promotions black friday sale discount", run: () => go("/admin/banners") },
      { id: "p-settings", icon: Settings, title: "Settings", subtitle: "Payments, shipping and your account", keywords: "settings payments razorpay shipping account cod", run: () => go("/admin/settings") },
      { id: "p-help", icon: LifeBuoy, title: "Help & Support", subtitle: "Guides and keyboard shortcuts", keywords: "help support guides shortcuts faq", run: () => go("/admin/help") },
    ];

    const match = (i: Item) =>
      !term || (typeof i.title === "string" && i.title.toLowerCase().includes(lower)) || i.keywords?.includes(lower);

    return [
      { title: "Search", items: searchItems },
      {
        title: "Recent searches",
        items: recentItems,
        action: (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setRecent([]);
              saveRecent([]);
              setActive(0);
            }}
            className="text-[0.7rem] text-neutral-400 hover:text-neutral-900"
          >
            Clear
          </button>
        ),
      },
      { title: "Actions", items: actions.filter(match) },
      { title: "Pages", items: pages.filter(match) },
    ].filter((s) => s.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, lower, recent, toFulfil]);

  const flat = sections.flatMap((s) => s.items);
  const current = Math.min(active, Math.max(flat.length - 1, 0));

  // Keep the highlighted row in view while arrowing
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${current}"]`)?.scrollIntoView({ block: "nearest" });
  }, [current]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown" && flat.length) {
      e.preventDefault();
      setActive((current + 1) % flat.length);
    } else if (e.key === "ArrowUp" && flat.length) {
      e.preventDefault();
      setActive((current - 1 + flat.length) % flat.length);
    } else if (e.key === "Enter" && flat[current]) {
      e.preventDefault();
      flat[current].run();
    }
  };

  let index = -1;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 animate-fade-in bg-neutral-900/20" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative flex max-h-[min(30rem,76vh)] w-full max-w-lg animate-palette-in flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white font-sans text-neutral-900 shadow-lg"
      >
        <div className="flex h-11 items-center gap-2.5 border-b border-neutral-100 px-3.5">
          <Search className="size-4 shrink-0 text-neutral-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            placeholder="Search orders, products, pages, actions…"
            aria-label="Search orders, products, pages and actions"
            role="combobox"
            aria-expanded
            aria-controls="palette-list"
            aria-activedescendant={flat[current] ? `palette-${flat[current].id}` : undefined}
            className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-neutral-400 focus:outline-none"
          />
          <button type="button" onClick={onClose} aria-label="Close search">
            <Kbd>Esc</Kbd>
          </button>
        </div>

        <div ref={listRef} id="palette-list" role="listbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
          {flat.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium">No matches for “{term}”</p>
              <p className="mt-1 text-xs text-neutral-500">Try an order number like BF10002, a customer or a product name.</p>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.title} className="py-1 [&+&]:border-t [&+&]:border-neutral-100">
                <div className="flex items-center justify-between px-2.5 pb-1 pt-1.5">
                  <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-neutral-400">{section.title}</span>
                  {section.action}
                </div>
                <ul>
                  {section.items.map((item) => {
                    index++;
                    const i = index;
                    const on = i === current;
                    const Icon = item.icon;
                    return (
                      <li key={item.id} id={`palette-${item.id}`} role="option" aria-selected={on} data-index={i}>
                        <button
                          type="button"
                          onMouseMove={() => active !== i && setActive(i)}
                          onClick={item.run}
                          className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                            on ? "bg-neutral-100" : ""
                          }`}
                        >
                          <Icon className={`size-4 shrink-0 ${on ? "text-neutral-900" : "text-neutral-400"}`} />
                          <span className="flex min-w-0 flex-1 items-baseline gap-2">
                            <span className="truncate text-neutral-900">{item.title}</span>
                            {item.subtitle && <span className="truncate text-xs text-neutral-400">{item.subtitle}</span>}
                          </span>
                          {on && <CornerDownLeft className="size-3.5 shrink-0 text-neutral-400" aria-hidden />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-neutral-100 bg-neutral-50 px-3.5 py-2 text-[0.7rem] text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Kbd><ArrowUp className="size-3" /></Kbd>
            <Kbd><ArrowDown className="size-3" /></Kbd>
            to move
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd><CornerDownLeft className="size-3" /></Kbd>
            to open
          </span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <Kbd>Esc</Kbd> to close
          </span>
          <span className="ml-auto tabular-nums">
            {flat.length} {flat.length === 1 ? "result" : "results"}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded border border-neutral-200 bg-white px-1 font-sans text-[0.65rem] font-medium text-neutral-500">
      {children}
    </kbd>
  );
}
