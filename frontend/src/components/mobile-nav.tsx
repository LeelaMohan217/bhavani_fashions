"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, Menu, Minus, Package, Plus, X } from "lucide-react";
import { OCCASIONS, PRICE_RANGES, priceHref } from "@/lib/content";
import type { NavNode } from "@/lib/types";
import { useRecentOrder } from "@/lib/recent-order";
import { Logo } from "./logo";

type Section = "occasion" | "price";

/** Phone/tablet menu: full screen. Category links, then Shop by occasion and Shop by price as an accordion. */
export function MobileNav({ items }: { items: NavNode[] }) {
  const [open, setOpen] = useState(false);
  // One section open at a time; opening one closes the other
  const [section, setSection] = useState<Section | null>(null);
  const close = () => setOpen(false);
  const recentOrder = useRecentOrder();

  // Lock page scroll and allow Escape to close while open
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

  const toggle = (s: Section) => setSection((cur) => (cur === s ? null : s));

  const occasions = OCCASIONS.map((o) => ({ label: o, href: `/shop?occasion=${o}` }));
  const prices = PRICE_RANGES.map((r) => ({ label: r.label, href: priceHref(r) }));

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="-ml-2 inline-flex size-10 items-center justify-center rounded-full hover:bg-sand"
      >
        <Menu className="size-5" strokeWidth={1.5} />
      </button>

      {/* Portalled to <body> so it covers the whole screen */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-canvas" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="container-x flex h-[4.5rem] shrink-0 items-center justify-between border-b border-line">
              <span onClick={close}>
                <Logo align="start" />
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                autoFocus
                className="-mr-2 inline-flex size-10 items-center justify-center rounded-full hover:bg-sand"
              >
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>

            <nav aria-label="Mobile" className="container-x flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-8">
              {/* Menu from Admin → Navigation; links with links under them expand in place */}
              <ul className="py-3">
                <li>
                  <Link href="/shop" onClick={close} className="block py-3 text-base font-medium text-ink">
                    All products
                  </Link>
                </li>
                {items.map((n) => (
                  <MenuNode key={n.id} node={n} depth={0} onNavigate={close} />
                ))}
              </ul>

              <div className="divide-y divide-line border-y border-line">
                <Accordion title="Shop by occasion" open={section === "occasion"} onToggle={() => toggle("occasion")} links={occasions} onNavigate={close} />
                <Accordion title="Shop by price" open={section === "price"} onToggle={() => toggle("price")} links={prices} onNavigate={close} />
              </div>

              <div className="mt-auto pt-8">
                {/* Track order: the most useful link for anyone who has already ordered, so it stands out */}
                <Link
                  href={recentOrder ? `/order/${recentOrder.id}` : "/track-order"}
                  onClick={close}
                  className="group flex items-center gap-3.5 rounded-xl bg-ink p-4 text-canvas transition-colors hover:bg-ink-soft"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-clay">
                    <Package className="size-5" strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">Track your order</span>
                    <span className="block truncate text-xs text-canvas/70">
                      {recentOrder ? `Order ${recentOrder.number}` : "Check delivery status"}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
                </Link>
              </div>
            </nav>
          </div>,
          document.body,
        )}
    </div>
  );
}

/** One menu link; if it has links under it, a +/− button opens them below (three levels at most) */
function MenuNode({ node, depth, onNavigate }: { node: NavNode; depth: number; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const text = depth === 0 ? "py-3 text-base font-medium text-ink" : depth === 1 ? "py-2.5 text-[0.95rem] text-ink" : "py-2 text-[0.9rem] text-ink-soft";
  const label = (
    <>
      {node.label}
      {node.badge && <span className="ml-2 rounded-full bg-clay px-1.5 py-px align-middle text-[0.6rem] font-semibold text-canvas">{node.badge}</span>}
    </>
  );
  const hasKids = node.children.length > 0;

  return (
    <li style={{ paddingLeft: depth ? 16 : 0 }}>
      <div className="flex items-center justify-between gap-3">
        {node.href ? (
          <Link href={node.href} onClick={onNavigate} className={`block flex-1 ${text}`}>
            {label}
          </Link>
        ) : (
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={id} className={`block flex-1 text-left ${text}`}>
            {label}
          </button>
        )}
        {hasKids && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={id}
            aria-label={`${open ? "Hide" : "Show"} links under ${node.label}`}
            className="-mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink hover:bg-sand"
          >
            {open ? <Minus className="size-4" strokeWidth={1.75} /> : <Plus className="size-4" strokeWidth={1.75} />}
          </button>
        )}
      </div>
      {hasKids && (
        <div id={id} className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <ul className="overflow-hidden" inert={!open}>
            {node.children.map((c) => (
              <MenuNode key={c.id} node={c} depth={depth + 1} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function Accordion({
  title,
  open,
  onToggle,
  links,
  onNavigate,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  links: { label: string; href: string }[];
  onNavigate: () => void;
}) {
  const id = useId();
  return (
    <section>
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="flex w-full items-center justify-between py-4 text-left text-base font-medium text-ink"
        >
          {title}
          {open ? <Minus className="size-4 text-ink" strokeWidth={1.75} /> : <Plus className="size-4 text-ink" strokeWidth={1.75} />}
        </button>
      </h2>
      {/* Height animates open and closed */}
      <div id={id} className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <ul className="overflow-hidden" inert={!open}>
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={onNavigate} className="block py-2.5 pl-4 text-[0.95rem] text-ink-soft transition-colors hover:text-ink">
                {l.label}
              </Link>
            </li>
          ))}
          <li aria-hidden className="h-3" />
        </ul>
      </div>
    </section>
  );
}
