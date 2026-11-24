import { discountPercent, formatPrice } from "@/lib/format";

export function Price({
  price,
  compareAtPrice,
  size = "sm",
}: {
  price: number;
  compareAtPrice: number | null;
  size?: "sm" | "lg";
}) {
  const off = discountPercent(price, compareAtPrice);

  return (
    <p className={`flex flex-wrap items-baseline gap-x-2.5 ${size === "lg" ? "text-xl" : "text-sm"}`}>
      <span className="tabular-nums text-ink">{formatPrice(price)}</span>
      {off && compareAtPrice && (
        <>
          <span className="sr-only">, was</span>
          <s className={`tabular-nums text-stone ${size === "lg" ? "text-base" : "text-xs"}`}>
            {formatPrice(compareAtPrice)}
          </s>
          <span className={`text-clay ${size === "lg" ? "text-sm" : "text-xs"}`}>{off}% off</span>
        </>
      )}
    </p>
  );
}
