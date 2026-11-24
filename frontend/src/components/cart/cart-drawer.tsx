"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, Lock, ShoppingBag, X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart } from "./cart-provider";
import { CartLine } from "./cart-line";

export function CartDrawer() {
  const { cart, drawerOpen, closeDrawer } = useCart();

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  const items = cart?.items ?? [];
  const count = cart?.itemCount ?? 0;
  const blocked = items.some((i) => i.unavailable);

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <div onClick={closeDrawer} className="absolute inset-0 animate-fade-in bg-ink/30" />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[28rem] animate-slide-in-right flex-col bg-canvas">
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="display text-[1.75rem]">
            Your bag <span className="text-stone">({count})</span>
          </h2>
          <button
            type="button"
            aria-label="Close bag"
            onClick={closeDrawer}
            autoFocus
            className="-mr-2 inline-flex size-10 items-center justify-center rounded-full hover:bg-sand"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="inline-flex size-16 items-center justify-center rounded-full bg-sand">
              <ShoppingBag className="size-6 text-stone" strokeWidth={1.25} />
            </span>
            <p className="display mt-6 text-3xl">Your bag is empty</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone">
              Handwoven pieces, waiting to be worn. Start with our sarees.
            </p>
            <Link
              href="/shop/sarees"
              onClick={closeDrawer}
              className="eyebrow group mt-8 inline-flex items-center gap-3 bg-ink px-7 py-4 text-canvas transition-colors hover:bg-clay-deep"
            >
              Explore sarees
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {items.map((item) => (
                <CartLine key={item.id} item={item} onNavigate={closeDrawer} />
              ))}
            </ul>

            <footer className="border-t border-line bg-canvas px-6 pb-6 pt-5">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Subtotal</dt>
                  <dd className="tabular-nums">{formatPrice(cart!.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Shipping</dt>
                  <dd className="text-clay">Free</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-stone">Inclusive of all taxes. COD available at checkout.</p>

              {blocked && (
                <p role="alert" className="mt-4 text-xs text-clay">
                  Please update the highlighted pieces before checking out.
                </p>
              )}

              <Link
                href="/checkout"
                onClick={closeDrawer}
                aria-disabled={blocked}
                className={`eyebrow mt-5 flex h-14 items-center justify-center gap-3 text-canvas transition-colors ${
                  blocked ? "pointer-events-none bg-stone" : "bg-ink hover:bg-clay-deep"
                }`}
              >
                <Lock className="size-3.5" strokeWidth={1.5} />
                Checkout · {formatPrice(cart!.subtotal)}
              </Link>
              <Link
                href="/bag"
                onClick={closeDrawer}
                className="eyebrow mt-4 block text-center text-ink-soft hover:text-ink"
              >
                <span className="link-draw pb-0.5">View full bag</span>
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>,
    document.body,
  );
}
