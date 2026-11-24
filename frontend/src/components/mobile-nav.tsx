"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronRight, Menu, Package, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/content";
import { useRecentOrder } from "@/lib/recent-order";

export function MobileNav() {
  const [open, setOpen] = useState(false);
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

      {/* Portalled to <body>: the header's backdrop-filter would otherwise trap this fixed drawer inside it */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
            <div onClick={close} className="absolute inset-0 animate-fade-in bg-ink/30" />
            <nav
              aria-label="Mobile"
              className="absolute inset-y-0 left-0 flex w-[min(88vw,24rem)] animate-slide-in flex-col bg-canvas px-6 pb-8 pt-5"
            >
              <div className="flex items-center justify-between">
                <span className="eyebrow text-stone">Menu</span>
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

              <ul className="mt-6">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={close}
                      className="group flex items-center justify-between py-3.5 text-base font-medium text-ink"
                    >
                      {l.label}
                      <ChevronRight className="size-4 text-stone transition-colors group-hover:text-clay" strokeWidth={1.5} />
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
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

                <div className="mt-5 space-y-3 text-sm text-ink-soft">
                  {[
                    ["Wishlist", "/wishlist"],
                    ["Contact us", "/contact"],
                  ].map(([label, href]) => (
                    <Link key={href} href={href} onClick={close} className="flex items-center justify-between py-1">
                      {label}
                      <ArrowUpRight className="size-4 text-stone" strokeWidth={1.5} />
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>,
          document.body,
        )}
    </div>
  );
}
