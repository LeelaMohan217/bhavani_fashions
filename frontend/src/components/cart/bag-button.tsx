"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";

export function BagButton({ className }: { className: string }) {
  const { cart, openDrawer } = useCart();
  const count = cart?.itemCount ?? 0;

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={`Shopping bag, ${count} ${count === 1 ? "item" : "items"}`}
      className={`${className} relative inline-flex`}
    >
      <ShoppingBag className="size-[1.15rem]" strokeWidth={1.5} />
      {count > 0 && (
        <span
          key={count}
          className="absolute right-0.5 top-0.5 flex h-4 min-w-4 animate-fade-in items-center justify-center rounded-full bg-clay px-1 text-[0.6rem] font-medium tabular-nums text-canvas"
        >
          {count}
        </span>
      )}
    </button>
  );
}
