"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Heart, MessageCircle, Package, RotateCcw, User } from "lucide-react";
import { useRecentOrder } from "@/lib/recent-order";
import { useWishlist } from "@/lib/wishlist";

/**
 * Profile icon with a small account menu. There are no customer accounts yet, so it gathers
 * what a shopper needs after buying: their order, wishlist, returns and contact.
 */
export function ProfileMenu({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const recentOrder = useRecentOrder();
  const { items } = useWishlist();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  const links = [
    {
      href: recentOrder ? `/order/${recentOrder.id}` : "/track-order",
      icon: Package,
      label: "Track my order",
      hint: recentOrder ? `Order ${recentOrder.number}` : "With your order number",
    },
    { href: "/wishlist", icon: Heart, label: "Wishlist", hint: items.length ? `${items.length} saved` : "Nothing saved yet" },
    { href: "/returns", icon: RotateCcw, label: "Returns & exchanges", hint: "7-day easy returns" },
    { href: "/contact", icon: MessageCircle, label: "Contact us", hint: "Questions, sizing, styling" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="My account"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${className} ${open ? "bg-sand" : ""}`}
      >
        <User className="size-[1.15rem]" strokeWidth={1.5} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="My account"
          className="absolute right-0 top-full z-50 mt-2 w-[min(17rem,calc(100vw-2rem))] animate-palette-in border border-line bg-canvas py-1.5 shadow-[0_16px_40px_-16px_rgb(17_17_17/0.3)]"
        >
          {links.map(({ href, icon: Icon, label, hint }) => (
            <Link
              key={label}
              role="menuitem"
              href={href}
              onClick={close}
              className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-sand"
            >
              <Icon className="size-4 shrink-0 text-stone group-hover:text-ink" strokeWidth={1.5} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-ink">{label}</span>
                <span className="block truncate text-xs text-stone">{hint}</span>
              </span>
              <ChevronRight className="size-3.5 shrink-0 text-stone" strokeWidth={1.5} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
