"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { LoaderCircle, ShoppingBag, X } from "lucide-react";
import type { ProductCard } from "@/lib/types";
import { useCart } from "./cart/cart-provider";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

const button =
  "eyebrow flex h-10 w-full items-center justify-center gap-2 border border-ink/80 text-[0.625rem] text-ink transition-colors hover:bg-ink hover:text-canvas disabled:cursor-not-allowed disabled:border-line disabled:text-stone disabled:hover:bg-transparent";

/**
 * "Add to bag" under a product card. One buyable option (free size, one colour) is added
 * straight away; otherwise a small picker opens on the card to choose colour and size.
 */
export function QuickAdd({ product }: { product: ProductCard }) {
  const { add } = useCart();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const options = product.options ?? [];
  const colours = [...new Map(options.map((o) => [o.color, o.colorHex])).entries()];
  const sized = options.some((o) => o.size);
  const firstInStock = options.find((o) => o.stock > 0);
  const [colour, setColour] = useState(firstInStock?.color);
  const panel = useRef<HTMLDivElement>(null);

  // Close the picker on Escape or a press outside it
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => !panel.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const addOption = (id: string) => {
    setError(null);
    startTransition(async () => {
      const err = await add(id, 1);
      if (err) setError(err);
      else setOpen(false);
    });
  };

  if (!product.inStock) {
    return (
      <button type="button" disabled className={button}>
        Sold out
      </button>
    );
  }

  // Older wishlist snapshots don't carry options: choose on the product page
  if (options.length === 0 || !firstInStock) {
    return (
      <Link href={`/products/${product.slug}`} className={button}>
        Choose options
      </Link>
    );
  }

  const needsChoice = colours.length > 1 || sized;
  const sizesForColour = options
    .filter((o) => o.color === colour && o.size)
    .sort((a, b) => SIZE_ORDER.indexOf(a.size!) - SIZE_ORDER.indexOf(b.size!));

  return (
    <div ref={panel} className="relative">
      {open && (
        <div
          role="dialog"
          aria-label={`Choose options for ${product.name}`}
          className="absolute inset-x-0 bottom-full z-20 mb-2 animate-fade-in border border-line bg-canvas p-3 shadow-[0_12px_32px_-12px_rgb(17_17_17/0.3)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone">{sized ? "Choose a size" : "Choose a colour"}</p>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="-mr-1 inline-flex size-6 items-center justify-center text-stone hover:text-ink">
              <X className="size-3.5" strokeWidth={1.5} />
            </button>
          </div>

          {colours.length > 1 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Colour">
              {colours.map(([name, hex]) => {
                const available = options.some((o) => o.color === name && o.stock > 0);
                const chosen = sized && name === colour;
                return (
                  <button
                    key={name}
                    type="button"
                    role={sized ? "radio" : undefined}
                    aria-checked={sized ? chosen : undefined}
                    aria-label={available ? name : `${name}, sold out`}
                    title={name}
                    disabled={!available || pending}
                    // Free-size pieces: picking the colour adds it
                    onClick={() => (sized ? setColour(name) : addOption(options.find((o) => o.color === name && o.stock > 0)!.id))}
                    className={`size-6 rounded-full p-[2px] ring-1 transition disabled:opacity-35 ${chosen ? "ring-ink" : "ring-transparent hover:ring-line"}`}
                  >
                    <span className="block size-full rounded-full shadow-[inset_0_0_0_1px_rgb(17_17_17/0.15)]" style={{ backgroundColor: hex }} />
                  </button>
                );
              })}
            </div>
          )}

          {sized && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {sizesForColour.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  disabled={o.stock === 0 || pending}
                  onClick={() => addOption(o.id)}
                  className="h-8 min-w-9 border border-line px-2 text-xs transition-colors hover:border-ink hover:bg-ink hover:text-canvas disabled:cursor-not-allowed disabled:text-stone/50 disabled:line-through disabled:hover:border-line disabled:hover:bg-transparent"
                >
                  {o.size}
                </button>
              ))}
            </div>
          )}

          {pending && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-stone">
              <LoaderCircle className="size-3 animate-spin" strokeWidth={1.5} /> Adding…
            </p>
          )}
          {error && <p className="mt-2 text-xs text-clay">{error}</p>}
        </div>
      )}

      <button
        type="button"
        disabled={pending}
        aria-expanded={needsChoice ? open : undefined}
        onClick={() => (needsChoice ? setOpen((o) => !o) : addOption(firstInStock.id))}
        className={button}
      >
        {pending && !open ? <LoaderCircle className="size-3.5 animate-spin" strokeWidth={1.5} /> : <ShoppingBag className="size-3.5" strokeWidth={1.5} />}
        {pending && !open ? "Adding…" : "Add to bag"}
      </button>
      {error && !open && <p className="mt-1.5 text-xs text-clay">{error}</p>}
    </div>
  );
}
