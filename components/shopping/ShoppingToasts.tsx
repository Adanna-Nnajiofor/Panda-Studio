"use client";

import type { ToastItem } from "./ShoppingProvider";

type ShoppingToastsProps = {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
};

export default function ShoppingToasts({
  toasts,
  onDismiss,
}: ShoppingToastsProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            "pointer-events-auto flex items-start gap-3 border-2 border-black px-4 py-3 shadow-[6px_6px_0_0_#000]",
            toast.type === "success"
              ? "bg-[#f6e9d7] text-black"
              : "bg-red-50 text-red-900",
          ].join(" ")}
        >
          <span className="text-lg leading-none" aria-hidden>
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <div className="flex-1 text-sm font-semibold">{toast.message}</div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-xs font-black uppercase opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
