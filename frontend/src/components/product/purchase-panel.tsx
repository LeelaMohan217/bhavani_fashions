"use client";

import { useMemo, useState, useTransition } from "react";
import { LoaderCircle, Minus, Plus, Ruler, ShoppingBag } from "lucide-react";
import type { ProductVariant } from "@/lib/types";
import { WishlistButton } from "../wishlist-button";
import { useCart } from "../cart/cart-provider";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

export function PurchasePanel({ name, variants }: { name: string; variants: ProductVariant[] }) {
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
      else setQty(1);
    });
  };

  return (
    <div className="space-y-8">
      {colors.length > 0 && (
        <fieldset>
          <legend className="eyebrow text-stone">
            Colour — <span className="text-ink">{color}</span>
          </legend>
          <div className="mt-4 flex flex-wrap gap-3">
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
                className={`size-9 rounded-full p-[3px] ring-1 transition ${
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
          <div className="flex items-center justify-between">
            <legend className="eyebrow text-stone">Size</legend>
            <button type="button" className="eyebrow inline-flex items-center gap-1.5 text-ink-soft hover:text-ink">
              <Ruler className="size-3.5" strokeWidth={1.5} />
              <span className="link-draw">Size guide</span>
            </button>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2">
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
                  className={`h-12 border text-sm transition-colors ${
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

      {selected && selected.stock > 0 && selected.stock <= 4 && (
        <p className="flex items-center gap-2 text-sm text-clay">
          <span className="size-1.5 rounded-full bg-clay" />
          Only {selected.stock} left — handwoven pieces rarely restock.
        </p>
      )}

      <div className="flex gap-3">
        <div className="flex h-14 items-center border border-line">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="inline-flex h-full w-11 items-center justify-center hover:bg-sand"
          >
            <Minus className="size-3.5" strokeWidth={1.5} />
          </button>
          <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            className="inline-flex h-full w-11 items-center justify-center hover:bg-sand"
          >
            <Plus className="size-3.5" strokeWidth={1.5} />
          </button>
        </div>

        <button
          type="button"
          disabled={soldOut || adding}
          onClick={addToBag}
          className="eyebrow group flex h-14 flex-1 items-center justify-center gap-3 bg-ink text-canvas transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:bg-stone"
        >
          {adding ? (
            <LoaderCircle className="size-4 animate-spin" strokeWidth={1.5} />
          ) : (
            <ShoppingBag className="size-4" strokeWidth={1.5} />
          )}
          {soldOut ? "Sold out" : adding ? "Adding…" : "Add to bag"}
        </button>

        <WishlistButton name={name} className="size-14 rounded-none border border-line bg-transparent hover:bg-sand" />
      </div>

      {notice && (
        <p role="status" className="-mt-4 text-sm text-ink-soft">
          {notice}
        </p>
      )}
    </div>
  );
}
