"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, LoaderCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import type { ProductCard, ProductVariant } from "@/lib/types";
import { WishlistTextButton } from "../wishlist-button";
import { ShareButton } from "./share-button";
import { useCart } from "../cart/cart-provider";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

export function PurchasePanel({ product, variants }: { product: ProductCard; variants: ProductVariant[] }) {
  const colors = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of variants) map.set(v.color, v.colorHex);
    return [...map].map(([color, hex]) => ({ color, hex }));
  }, [variants]);

  const [color, setColor] = useState(colors[0]?.color);
  const forColor = variants.filter((v) => v.color === color);
  const sized = forColor.some((v) => v.size);
  const sizes = sized
    ? [...forColor].sort((a, b) => SIZE_ORDER.indexOf(a.size!) - SIZE_ORDER.indexOf(b.size!))
    : [];

  const [sizeSku, setSizeSku] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);

  const selected = sized ? forColor.find((v) => v.sku === sizeSku) : forColor[0];
  const maxQty = Math.max(1, Math.min(selected?.stock ?? 1, 5));
  const soldOut = forColor.every((v) => v.stock === 0);

  const { add } = useCart();
  const [adding, startAdding] = useTransition();
  // Brief "Added" tick on the button after a successful add
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 1800);
    return () => window.clearTimeout(t);
  }, [added]);

  const addToBag = () => {
    if (sized && !selected) {
      setNotice("Please choose a size.");
      return;
    }
    if (!selected) return;
    setNotice(null);
    startAdding(async () => {
      const error = await add(selected.id, qty);
      if (error) setNotice(error);
      else {
        setQty(1);
        setAdded(true);
      }
    });
  };

  return (
    <div className="space-y-5">
      {colors.length > 0 && (
        <fieldset>
          <legend className="text-xs text-stone">
            Colour: <span className="text-ink">{color}</span>
          </legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.color}
                type="button"
                aria-label={c.color}
                aria-pressed={c.color === color}
                onClick={() => {
                  setColor(c.color);
                  setSizeSku(null);
                  setNotice(null);
                }}
                className={`size-7 rounded-full p-[2px] ring-1 transition ${
                  c.color === color ? "ring-ink" : "ring-transparent hover:ring-line"
                }`}
              >
                <span className="block size-full rounded-full ring-1 ring-ink/10" style={{ backgroundColor: c.hex }} />
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {sized && (
        <fieldset>
          <legend className="text-xs text-stone">Size</legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {sizes.map((v) => {
              const out = v.stock === 0;
              const active = v.sku === sizeSku;
              return (
                <button
                  key={v.sku}
                  type="button"
                  disabled={out}
                  aria-pressed={active}
                  onClick={() => {
                    setSizeSku(v.sku);
                    setQty(1);
                    setNotice(null);
                  }}
                  className={`h-9 min-w-10 border px-3 text-xs transition-colors ${
                    active
                      ? "border-ink bg-ink text-canvas"
                      : out
                        ? "cursor-not-allowed border-line text-stone/50 line-through"
                        : "border-line hover:border-ink"
                  }`}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Stock for the chosen colour (and size) */}
      {!soldOut && (
        <p className={`flex items-center gap-1.5 text-xs ${selected && selected.stock <= 4 ? "text-clay" : "text-ink-soft"}`}>
          {selected && selected.stock <= 4 ? (
            <>
              <span className="size-1.5 rounded-full bg-clay" />
              Only {selected.stock} left. Handwoven pieces rarely restock.
            </>
          ) : (
            <>
              <Check className="size-3.5 text-clay" strokeWidth={1.75} />
              In stock, ready to dispatch
            </>
          )}
        </p>
      )}

      <div className="flex gap-2">
        <div className="flex h-11 items-center border border-line">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="inline-flex h-full w-9 items-center justify-center hover:bg-sand"
          >
            <Minus className="size-3.5" strokeWidth={1.5} />
          </button>
          <span className="w-7 text-center text-sm tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            className="inline-flex h-full w-9 items-center justify-center hover:bg-sand"
          >
            <Plus className="size-3.5" strokeWidth={1.5} />
          </button>
        </div>

        <button
          type="button"
          disabled={soldOut || adding}
          onClick={addToBag}
          className="eyebrow group flex h-11 flex-1 items-center justify-center gap-2.5 bg-ink text-[0.65rem] text-canvas transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:bg-stone"
        >
          {adding ? (
            <LoaderCircle className="size-4 animate-spin" strokeWidth={1.5} />
          ) : added ? (
            <Check className="size-4 animate-pop" strokeWidth={1.75} />
          ) : (
            <ShoppingBag className="size-4" strokeWidth={1.5} />
          )}
          {soldOut ? "Sold out" : adding ? "Adding…" : added ? "Added to bag" : "Add to bag"}
        </button>
      </div>

      {notice && (
        <p role="status" className="-mt-2 text-xs text-ink-soft">
          {notice}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-soft">
        <WishlistTextButton product={product} className="transition-colors hover:text-ink" />
        <ShareButton title={product.name} className="transition-colors hover:text-ink" />
      </div>
    </div>
  );
}
