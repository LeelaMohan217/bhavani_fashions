// Store-wide commercial rules. All amounts in paise.

export const STORE = {
  shippingFee: 0, // Free shipping across India
  codFee: 49_00, // ₹49 cash-on-delivery handling fee
  maxQtyPerItem: 5,
  currency: "INR",
} as const;

/** Display format for order numbers, e.g. 1 → "BF10001" */
export const formatOrderNumber = (n: number) => `BF${10000 + n}`;
