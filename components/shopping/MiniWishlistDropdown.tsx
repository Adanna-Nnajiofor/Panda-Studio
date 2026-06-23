"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { formatNaira, type WishlistItem } from "../../lib/shopping";

type MiniWishlistDropdownProps = {
  items: WishlistItem[];
  variant?: "light" | "dark";
  onClose: () => void;
  onMoveAllToCart: () => void;
  moving: boolean;
};

export default function MiniWishlistDropdown({
  items,
  variant = "light",
  onClose,
  onMoveAllToCart,
  moving,
}: MiniWishlistDropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isDark = variant === "dark";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const preview = items.slice(0, 4);
  const moreCount = items.length - preview.length;

  return (
    <div
      ref={panelRef}
      className={[
        "absolute right-0 top-[calc(100%+8px)] z-50 w-80 border-2 shadow-[8px_8px_0_0_#000]",
        isDark
          ? "border-[#f2eadf] bg-black text-[#f2eadf]"
          : "border-black bg-white text-black",
      ].join(" ")}
      role="dialog"
      aria-label="Wishlist preview"
    >
      <div
        className={[
          "border-b-2 px-4 py-3",
          isDark ? "border-[#f2eadf]/30" : "border-black",
        ].join(" ")}
      >
        <p className="text-xs font-black uppercase tracking-[0.2em]">
          Wishlist
        </p>
        <p className="mt-0.5 text-xs opacity-70">
          {items.length} saved item{items.length === 1 ? "" : "s"}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm">
          <p className="font-semibold">Nothing saved yet</p>
          <p className="mt-1 text-xs opacity-70">
            Tap the heart on any gear card.
          </p>
        </div>
      ) : (
        <ul className="max-h-56 overflow-y-auto">
          {preview.map((item) => (
            <li
              key={item._id}
              className={[
                "border-b px-4 py-3 text-sm last:border-b-0",
                isDark ? "border-[#f2eadf]/20" : "border-black/10",
              ].join(" ")}
            >
              <p className="font-black uppercase leading-tight">
                {item.equipment.name ?? "Equipment"}
              </p>
              <p className="mt-1 text-xs opacity-70">
                {formatNaira(item.equipment.hourlyRate ?? 0)}/hr · Qty{" "}
                {item.quantity}
              </p>
            </li>
          ))}
          {moreCount > 0 ? (
            <li className="px-4 py-2 text-xs opacity-70">
              +{moreCount} more item{moreCount === 1 ? "" : "s"}
            </li>
          ) : null}
        </ul>
      )}

      <div className="flex flex-col gap-2 p-3">
        {items.length > 0 ? (
          <button
            type="button"
            disabled={moving}
            onClick={onMoveAllToCart}
            className={[
              "border-2 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] disabled:opacity-50",
              isDark
                ? "border-[#f2eadf] bg-[#f2eadf] text-black"
                : "border-black bg-black text-[#f2eadf]",
            ].join(" ")}
          >
            {moving ? "Moving..." : "Move all to cart"}
          </button>
        ) : null}
        <Link
          href="/wishlist"
          onClick={onClose}
          className={[
            "block border-2 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.14em]",
            isDark
              ? "border-[#f2eadf] text-[#f2eadf]"
              : "border-black bg-white text-black",
          ].join(" ")}
        >
          View wishlist
        </Link>
      </div>
    </div>
  );
}
