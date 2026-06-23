"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import { useAuthContext } from "../AuthProvider";
import MiniCartDropdown from "./MiniCartDropdown";
import MiniWishlistDropdown from "./MiniWishlistDropdown";
import { useShopping } from "./ShoppingProvider";

type IconButtonProps = {
  label: string;
  count: number;
  children: ReactNode;
  variant?: "light" | "dark";
  isOpen: boolean;
  onToggle: () => void;
  href?: string;
};

function IconButton({
  label,
  count,
  children,
  variant = "light",
  isOpen,
  onToggle,
  href,
}: IconButtonProps) {
  const isDark = variant === "dark";

  const className = [
    "relative inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-transform hover:-translate-y-0.5",
    isOpen
      ? isDark
        ? "border-[#f2eadf] bg-[#f2eadf] text-black"
        : "border-black bg-black text-[#f2eadf]"
      : isDark
        ? "border-[#f2eadf] bg-black text-[#f2eadf] hover:bg-[#1a1a1a]"
        : "border-slate-200 bg-white text-slate-800 hover:border-slate-300",
  ].join(" ");

  const badge = count > 0 ? (
    <span
      className={[
        "absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black",
        isDark && !isOpen ? "bg-[#f2eadf] text-black" : "bg-slate-900 text-white",
      ].join(" ")}
    >
      {count > 99 ? "99+" : count}
    </span>
  ) : null;

  if (href && count === 0) {
    return (
      <Link
        href={href}
        aria-label={label}
        className={className}
      >
        {children}
        {badge}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={`${label}${count > 0 ? `, ${count} items` : ""}`}
      aria-expanded={isOpen}
      onClick={onToggle}
      className={className}
    >
      {children}
      {badge}
    </button>
  );
}

function CartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

type ShoppingHeaderIconsProps = {
  variant?: "light" | "dark";
};

export default function ShoppingHeaderIcons({
  variant = "light",
}: ShoppingHeaderIconsProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  const {
    cartCount,
    wishlistCount,
    cartTotal,
    cartItems,
    wishlistItems,
    movingToCart,
    moveAllWishlistToCart,
  } = useShopping();

  const [openPanel, setOpenPanel] = useState<"cart" | "wishlist" | null>(null);

  const closePanels = useCallback(() => setOpenPanel(null), []);

  const toggleCart = useCallback(() => {
    setOpenPanel((prev) => (prev === "cart" ? null : "cart"));
  }, []);

  const toggleWishlist = useCallback(() => {
    setOpenPanel((prev) => (prev === "wishlist" ? null : "wishlist"));
  }, []);

  const handleMoveAll = useCallback(async () => {
    try {
      await moveAllWishlistToCart();
      closePanels();
      router.push("/cart");
    } catch {
      // toast shown by provider
    }
  }, [closePanels, moveAllWishlistToCart, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <IconButton
          label="Wishlist"
          count={wishlistCount}
          variant={variant}
          isOpen={openPanel === "wishlist"}
          onToggle={toggleWishlist}
          href="/wishlist"
        >
          <HeartIcon />
        </IconButton>
        {openPanel === "wishlist" ? (
          <MiniWishlistDropdown
            items={wishlistItems}
            variant={variant}
            onClose={closePanels}
            onMoveAllToCart={handleMoveAll}
            moving={movingToCart}
          />
        ) : null}
      </div>

      <div className="relative">
        <IconButton
          label="Cart"
          count={cartCount}
          variant={variant}
          isOpen={openPanel === "cart"}
          onToggle={toggleCart}
          href="/cart"
        >
          <CartIcon />
        </IconButton>
        {openPanel === "cart" ? (
          <MiniCartDropdown
            items={cartItems}
            totalAmount={cartTotal}
            variant={variant}
            onClose={closePanels}
          />
        ) : null}
      </div>
    </div>
  );
}
