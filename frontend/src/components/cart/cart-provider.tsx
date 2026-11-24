"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { addToCart, getCart, removeCartItem, updateCartItem } from "@/lib/cart-actions";
import type { Cart } from "@/lib/types";

type CartContextValue = {
  cart: Cart | null;
  /** True until the first load finishes */
  loading: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Each mutation resolves to an error message, or null on success */
  add: (variantId: string, quantity?: number) => Promise<string | null>;
  setQuantity: (itemId: string, quantity: number) => Promise<string | null>;
  remove: (itemId: string) => Promise<string | null>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setCart(await getCart());
    } catch {
      // Keep whatever we had; the bag will retry on the next action.
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load of the visitor's bag (cart id lives in an httpOnly cookie, so the server reads it)
  useEffect(() => {
    let active = true;
    getCart()
      .then((c) => active && setCart(c))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const add = useCallback(async (variantId: string, quantity = 1) => {
    const res = await addToCart(variantId, quantity);
    if (!res.ok) return res.error;
    setCart(res.cart);
    setDrawerOpen(true);
    return null;
  }, []);

  const setQuantity = useCallback(async (itemId: string, quantity: number) => {
    const res = await updateCartItem(itemId, quantity);
    if (!res.ok) return res.error;
    setCart(res.cart);
    return null;
  }, []);

  const remove = useCallback(async (itemId: string) => {
    const res = await removeCartItem(itemId);
    if (!res.ok) return res.error;
    setCart(res.cart);
    return null;
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      add,
      setQuantity,
      remove,
      refresh,
    }),
    [cart, loading, drawerOpen, add, setQuantity, remove, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
