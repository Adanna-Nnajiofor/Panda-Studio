"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuthContext } from "../AuthProvider";
import { apiJson } from "../../lib/api";
import type {
  AddItemOptions,
  CartItem,
  CartResponse,
  WishlistItem,
  WishlistResponse,
} from "../../lib/shopping";
import ShoppingToasts from "./ShoppingToasts";

export type ToastItem = {
  id: number;
  message: string;
  type: "success" | "error";
};

type ShoppingContextValue = {
  cartCount: number;
  wishlistCount: number;
  cartTotal: number;
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
  loading: boolean;
  movingToCart: boolean;
  refresh: () => Promise<void>;
  addToCart: (equipmentId: string, opts?: AddItemOptions) => Promise<void>;
  addToWishlist: (equipmentId: string, opts?: AddItemOptions) => Promise<void>;
  moveAllWishlistToCart: () => Promise<void>;
  showToast: (message: string, type?: ToastItem["type"]) => void;
};

const ShoppingContext = createContext<ShoppingContextValue | undefined>(
  undefined,
);

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [movingToCart, setMovingToCart] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismissToast = useCallback((id: number) => {
    const timer = toastTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastItem["type"] = "success") => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, message, type }]);
      const timer = setTimeout(() => dismissToast(id), 4000);
      toastTimers.current.set(id, timer);
    },
    [dismissToast],
  );

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCartCount(0);
      setWishlistCount(0);
      setCartTotal(0);
      setCartItems([]);
      setWishlistItems([]);
      return;
    }

    setLoading(true);
    try {
      const [cartData, wishlistData] = await Promise.all([
        apiJson<CartResponse>("/cart"),
        apiJson<WishlistResponse>("/wishlist"),
      ]);
      setCartCount(cartData.cart.items.length);
      setCartTotal(cartData.cart.totalAmount);
      setCartItems(cartData.cart.items);
      setWishlistCount(wishlistData.wishlist.items.length);
      setWishlistItems(wishlistData.wishlist.items);
    } catch {
      setCartCount(0);
      setWishlistCount(0);
      setCartTotal(0);
      setCartItems([]);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return () => {
      toastTimers.current.forEach((timer) => clearTimeout(timer));
      toastTimers.current.clear();
    };
  }, []);

  const addToCart = useCallback(
    async (equipmentId: string, opts: AddItemOptions = {}) => {
      try {
        await apiJson("/cart/items", {
          method: "POST",
          body: JSON.stringify({
            equipmentId,
            quantity: opts.quantity ?? 1,
            durationHours: opts.durationHours ?? 2,
          }),
        });
        await refresh();
        const name = opts.label ? `"${opts.label}"` : "Item";
        showToast(`${name} added to cart`, "success");
      } catch {
        showToast("Could not add to cart", "error");
        throw new Error("Could not add to cart");
      }
    },
    [refresh, showToast],
  );

  const addToWishlist = useCallback(
    async (equipmentId: string, opts: AddItemOptions = {}) => {
      try {
        await apiJson("/wishlist/items", {
          method: "POST",
          body: JSON.stringify({
            equipmentId,
            quantity: opts.quantity ?? 1,
            durationHours: opts.durationHours ?? 2,
          }),
        });
        await refresh();
        const name = opts.label ? `"${opts.label}"` : "Item";
        showToast(`${name} saved to wishlist`, "success");
      } catch {
        showToast("Could not save to wishlist", "error");
        throw new Error("Could not save to wishlist");
      }
    },
    [refresh, showToast],
  );

  const moveAllWishlistToCart = useCallback(async () => {
    setMovingToCart(true);
    try {
      await apiJson("/wishlist/move-to-cart", { method: "POST" });
      await refresh();
      showToast("Wishlist moved to cart", "success");
    } catch {
      showToast("Could not move wishlist to cart", "error");
      throw new Error("Could not move wishlist to cart");
    } finally {
      setMovingToCart(false);
    }
  }, [refresh, showToast]);

  const value = useMemo<ShoppingContextValue>(
    () => ({
      cartCount,
      wishlistCount,
      cartTotal,
      cartItems,
      wishlistItems,
      loading,
      movingToCart,
      refresh,
      addToCart,
      addToWishlist,
      moveAllWishlistToCart,
      showToast,
    }),
    [
      addToCart,
      addToWishlist,
      cartCount,
      cartItems,
      cartTotal,
      loading,
      moveAllWishlistToCart,
      movingToCart,
      refresh,
      showToast,
      wishlistCount,
      wishlistItems,
    ],
  );

  return (
    <ShoppingContext.Provider value={value}>
      {children}
      <ShoppingToasts toasts={toasts} onDismiss={dismissToast} />
    </ShoppingContext.Provider>
  );
}

export function useShopping() {
  const context = useContext(ShoppingContext);
  if (!context) {
    throw new Error("useShopping must be used within ShoppingProvider");
  }
  return context;
}
