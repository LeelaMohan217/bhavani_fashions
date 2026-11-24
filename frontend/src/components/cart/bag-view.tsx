"use client";

import Link from "next/link";
import { ArrowRight, Lock, RotateCcw, Truck } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart } from "./cart-provider";
import { CartLine } from "./cart-line";
import { BagSkeleton } from "../skeletons";

export function BagView() {
  const { cart, loading } = useCart();
  const items = cart?.items ?? [];
  const blocked = items.some((i) => i.unavailable);

  return (
    <div className="container-x pb-10 pt-10 md:pt-16">
      <nav aria-label="Breadcrumb" className="eyebrow flex items-center gap-2 text-stone">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span aria-hidden>/</span>
        <span className="text-ink">Bag</span>
      </nav>
      <h1 className="display mt-8 text-[3.25rem] md:text-[5.5rem]">
        Your bag{" "}
        {cart && cart.itemCount > 0 && <span className="text-stone">({cart.itemCount})</span>}
      </h1>

      {loading ? (
        <BagSkeleton />
      ) : items.length === 0 ? (
        <div className="mt-12 border-t border-line py-24 text-center">
          <p className="display text-3xl">Nothing in your bag yet</p>
          <p className="mt-3 text-sm text-stone">Save the pieces you love and come back to them anytime.</p>
          <Link
            href="/shop"
            className="eyebrow group mt-10 inline-flex items-center gap-3 bg-ink px-7 py-4 text-canvas transition-colors hover:bg-clay-deep"
          >
            Continue shopping
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 md:mt-14 lg:grid-cols-12 lg:gap-16">
          <ul className="divide-y divide-line border-y border-line lg:col-span-7">
            {items.map((item) => (
              <CartLine key={item.id} item={item} variant="page" />
            ))}
          </ul>

          <aside className="lg:col-span-5">
            <div className="bg-sand p-6 md:p-8 lg:sticky lg:top-28">
              <h2 className="eyebrow">Order summary</h2>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Subtotal</dt>
                  <dd className="tabular-nums">{formatPrice(cart!.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Shipping</dt>
                  <dd className="text-clay">Free</dd>
                </div>
                <div className="flex justify-between border-t border-ink/10 pt-4">
                  <dt className="font-medium">Total</dt>
                  <dd className="display text-2xl tabular-nums">{formatPrice(cart!.subtotal)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-stone">
                Inclusive of all taxes. A {formatPrice(cart!.codFee)} fee applies to cash on delivery.
              </p>

              {blocked && (
                <p role="alert" className="mt-5 text-xs text-clay">
                  Please update the highlighted pieces before checking out.
                </p>
              )}

              <Link
                href="/checkout"
                aria-disabled={blocked}
                className={`eyebrow mt-6 flex h-14 items-center justify-center gap-3 text-canvas transition-colors ${
                  blocked ? "pointer-events-none bg-stone" : "bg-ink hover:bg-clay-deep"
                }`}
              >
                <Lock className="size-3.5" strokeWidth={1.5} />
                Proceed to checkout
              </Link>

              <ul className="mt-6 space-y-3 border-t border-ink/10 pt-6 text-xs text-ink-soft">
                <li className="flex items-center gap-3">
                  <Truck className="size-4 text-clay" strokeWidth={1.5} /> Free delivery in 4 to 7 days across India
                </li>
                <li className="flex items-center gap-3">
                  <RotateCcw className="size-4 text-clay" strokeWidth={1.5} /> Easy 7-day returns and exchanges
                </li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
