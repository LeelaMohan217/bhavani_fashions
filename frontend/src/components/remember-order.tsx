"use client";

import { useEffect } from "react";
import { rememberOrder } from "@/lib/recent-order";

/** Saves the order being viewed so the menu can link straight back to it. */
export function RememberOrder({ id, number }: { id: string; number: string }) {
  useEffect(() => rememberOrder({ id, number }), [id, number]);
  return null;
}
