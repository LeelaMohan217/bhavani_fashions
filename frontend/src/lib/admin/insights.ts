import type { BestSellerPeriod } from "./types";

/** Periods for the Best sellers card and page */
export const PERIODS: { value: BestSellerPeriod; label: string }[] = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "all", label: "All time" },
];
