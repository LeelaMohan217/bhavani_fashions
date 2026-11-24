const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Formats a price stored in paise, e.g. 1245000 → "₹12,450" */
export function formatPrice(paise: number): string {
  return inr.format(paise / 100);
}

/** Whole-number discount percentage, or null when not on sale */
export function discountPercent(price: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
