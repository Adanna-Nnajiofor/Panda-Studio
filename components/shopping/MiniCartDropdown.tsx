"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatNaira, lineTotal, type CartItem } from "../../lib/shopping";

type MiniCartDropdownProps = {
  items: CartItem[];
  totalAmount: number;
  variant?: "light" | "dark";
  onClose: () => void;
};

export default function MiniCartDropdown({
  items,
  totalAmount,
  variant = "light",
  onClose,
}: MiniCartDropdownProps) {
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
      aria-label="Cart preview"
    >
      <div
        className={[
          "border-b-2 px-4 py-3",
          isDark ? "border-[#f2eadf]/30" : "border-black",
        ].join(" ")}
      >
        <p className="text-xs font-black uppercase tracking-[0.2em]">
          Your cart
        </p>
        <p className="mt-0.5 text-xs opacity-70">
          {items.length} item{items.length === 1 ? "" : "s"}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm">
          <p className="font-semibold">Cart is empty</p>
          <p className="mt-1 text-xs opacity-70">
            Add equipment from the catalog.
          </p>
        </div>
      ) : (
        <ul className="max-h-56 overflow-y-auto">
          {preview.map((item) => {
            const subtotal = lineTotal(
              item.equipment.hourlyRate ?? 0,
              item.quantity,
              item.durationHours,
            );
            return (
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
                  Qty {item.quantity} · {item.durationHours}h ·{" "}
                  {formatNaira(subtotal)}
                </p>
              </li>
            );
          })}
          {moreCount > 0 ? (
            <li className="px-4 py-2 text-xs opacity-70">
              +{moreCount} more item{moreCount === 1 ? "" : "s"}
            </li>
          ) : null}
        </ul>
      )}

      {items.length > 0 ? (
        <div
          className={[
            "border-t-2 px-4 py-3",
            isDark ? "border-[#f2eadf]/30" : "border-black",
          ].join(" ")}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase">Total</span>
            <span className="text-lg font-black">{formatNaira(totalAmount)}</span>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 p-3">
        <Link
          href="/cart"
          onClick={onClose}
          className={[
            "block border-2 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.14em]",
            isDark
              ? "border-[#f2eadf] bg-[#f2eadf] text-black"
              : "border-black bg-black text-[#f2eadf]",
          ].join(" ")}
        >
          View cart
        </Link>
        {items.length > 0 ? (
          <Link
            href="/checkout"
            onClick={onClose}
            className={[
              "block border-2 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.14em]",
              isDark
                ? "border-[#f2eadf] text-[#f2eadf]"
                : "border-black bg-white text-black",
            ].join(" ")}
          >
            Checkout
          </Link>
        ) : (
          <Link
            href="/equipment"
            onClick={onClose}
            className={[
              "block border-2 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.14em]",
              isDark
                ? "border-[#f2eadf] text-[#f2eadf]"
                : "border-black bg-white text-black",
            ].join(" ")}
          >
            Browse equipment
          </Link>
        )}
      </div>
    </div>
  );
}
