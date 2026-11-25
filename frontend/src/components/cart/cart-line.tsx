"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CartItem } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useFeedback } from "@/components/ui/feedback";
import { useCart } from "./cart-provider";
import { QuantityStepper } from "./quantity-stepper";

export function CartLine({
  item,
  onNavigate,
  variant = "drawer",
}: {
  item: CartItem;
  onNavigate?: () => void;
  variant?: "drawer" | "page";
}) {
  const { setQuantity, remove, add } = useCart();
  const { toast } = useFeedback();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<string | null>) =>
    startTransition(async () => {
      setError(await fn());
    });

  const onRemove = () =>
    startTransition(async () => {
      const err = await remove(item.id);
      if (err) return setError(err);
      const { variantId, quantity, productName } = item;
      toast(`${productName} removed`, {
        action: {
          label: "Undo",
          onClick: async () => {
            const undoErr = await add(variantId, quantity, { openDrawer: false });
            if (undoErr) toast(undoErr, { error: true });
          },
        },
      });
    });

  const href = `/products/${item.productSlug}`;
  const imgW = variant === "page" ? "w-28 md:w-36" : "w-[5.5rem]";

  return (
    <li className={`flex gap-4 py-6 transition-opacity md:gap-6 ${pending ? "opacity-60" : ""}`}>
      <Link href={href} onClick={onNavigate} className={`relative aspect-[3/4] shrink-0 overflow-hidden bg-sand ${imgW}`}>
        {item.image && (
          <Image src={item.image.url} alt={item.image.alt} fill sizes="144px" className="object-cover" />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={href}
              onClick={onNavigate}
              className={`font-display leading-snug tracking-[-0.01em] hover:text-clay ${variant === "page" ? "text-xl" : "text-[1.05rem]"}`}
            >
              {item.productName}
            </Link>
            <p className="mt-1 flex items-center gap-2 text-xs text-stone">
              <span
                className="size-2.5 rounded-full shadow-[inset_0_0_0_1px_rgb(17_17_17/0.18)]"
                style={{ backgroundColor: item.colorHex }}
                aria-hidden
              />
              {item.color}
              {item.size && <span>· Size {item.size}</span>}
            </p>
          </div>
          <p className="shrink-0 text-sm tabular-nums">{formatPrice(item.lineTotal)}</p>
        </div>

        {item.quantity > 1 && (
          <p className="mt-1 text-xs text-stone tabular-nums">{formatPrice(item.unitPrice)} each</p>
        )}

        {item.unavailable && (
          <p className="mt-2 text-xs text-clay">
            {item.maxQuantity === 0
              ? "Sold out. Please remove it to continue."
              : `Only ${item.maxQuantity} left. Please reduce the quantity.`}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-4">
          <QuantityStepper
            value={item.quantity}
            max={Math.max(item.maxQuantity, 1)}
            disabled={pending}
            label={item.productName}
            onChange={(q) => run(() => setQuantity(item.id, q))}
          />
          <button
            type="button"
            disabled={pending}
            onClick={onRemove}
            className="eyebrow link-draw pb-0.5 text-[0.6rem] text-stone hover:text-ink"
          >
            Remove
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-2 text-xs text-clay">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}
