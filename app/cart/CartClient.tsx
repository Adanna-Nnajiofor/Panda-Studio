"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "../../components/dashboard/DashboardShell";
import RoleGate from "../../components/dashboard/RoleGate";
import { useShopping } from "../../components/shopping/ShoppingProvider";
import { apiJson } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import {
  formatNaira,
  lineTotal,
  type CartItem,
  type CartResponse,
} from "../../lib/shopping";

export default function CartClient() {
  const router = useRouter();
  const { refresh: refreshCounts } = useShopping();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  const loadCart = async () => {
    const data = await apiJson<CartResponse>("/cart");
    setItems(data.cart.items);
    setTotalAmount(data.cart.totalAmount);
    await refreshCounts();
  };

  useEffect(() => {
    const run = async () => {
      try {
        setError(null);
        await loadCart();
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load cart"));
      } finally {
        setLoading(false);
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasItems = useMemo(() => items.length > 0, [items.length]);

  const updateItem = async (
    itemId: string,
    next: { quantity: number; durationHours: number },
  ) => {
    setUpdatingItemId(itemId);
    setError(null);
    try {
      await apiJson(`/cart/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(next),
      });
      await loadCart();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update item"));
    } finally {
      setUpdatingItemId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setRemovingItemId(itemId);
    setError(null);
    try {
      await apiJson(`/cart/items/${itemId}`, { method: "DELETE" });
      await loadCart();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to remove item"));
    } finally {
      setRemovingItemId(null);
    }
  };

  return (
    <RoleGate allowedRoles={["client", "admin", "super_admin", "staff"]}>
      <DashboardShell
        kicker="Shopping"
        title="Your cart"
        summary="Review gear, adjust rental duration, then proceed to checkout and pay securely."
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-4">
            {loading ? (
              <p className="text-sm">Loading cart...</p>
            ) : error ? (
              <p className="border-2 border-red-600 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </p>
            ) : !hasItems ? (
              <div className="border-4 border-black bg-white p-10 text-center shadow-[8px_8px_0_0_#000]">
                <p className="text-xl font-black uppercase">Cart is empty</p>
                <p className="mt-2 text-sm">
                  Browse equipment and add items to your cart.
                </p>
                <Link
                  href="/equipment"
                  className="mt-6 inline-block border-2 border-black bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#f2eadf]"
                >
                  Browse equipment
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <CartRow
                  key={item._id}
                  item={item}
                  updating={updatingItemId === item._id}
                  removing={removingItemId === item._id}
                  onUpdate={(next) => updateItem(item._id, next)}
                  onRemove={() => removeItem(item._id)}
                />
              ))
            )}
          </section>

          <aside className="h-fit border-4 border-black bg-[#f6e9d7] p-5 shadow-[8px_8px_0_0_#000]">
            <p className="text-xs font-black uppercase tracking-[0.24em]">
              Order summary
            </p>
            <p className="mt-4 text-3xl font-black">{formatNaira(totalAmount)}</p>
            <p className="mt-1 text-xs text-slate-700">
              {items.length} item{items.length === 1 ? "" : "s"} in cart
            </p>
            <button
              type="button"
              onClick={() => router.push("/checkout")}
              disabled={!hasItems}
              className="mt-6 w-full border-2 border-black bg-black px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#f2eadf] disabled:opacity-50"
            >
              Proceed to checkout
            </button>
            <Link
              href="/wishlist"
              className="mt-3 block w-full border-2 border-black bg-white px-4 py-3 text-center text-xs font-black uppercase tracking-[0.16em]"
            >
              View wishlist
            </Link>
          </aside>
        </div>
      </DashboardShell>
    </RoleGate>
  );
}

function CartRow({
  item,
  updating,
  removing,
  onUpdate,
  onRemove,
}: {
  item: CartItem;
  updating: boolean;
  removing: boolean;
  onUpdate: (next: { quantity: number; durationHours: number }) => void;
  onRemove: () => void;
}) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [durationHours, setDurationHours] = useState(item.durationHours);
  const subtotal = lineTotal(
    item.equipment.hourlyRate ?? 0,
    quantity,
    durationHours,
  );

  return (
    <article className="border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em]">
            Equipment
          </p>
          <h2 className="mt-1 text-lg font-black uppercase">
            {item.equipment.name ?? "Equipment"}
          </h2>
          <p className="mt-2 text-sm">
            {formatNaira(item.equipment.hourlyRate ?? 0)}/hr · Stock{" "}
            {item.equipment.quantity ?? "—"}
          </p>
          <p className="mt-2 text-sm font-black">
            Subtotal: {formatNaira(subtotal)}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-xs font-black uppercase">Qty</span>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="mt-1 w-20 border-2 border-black p-2"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase">Hours</span>
            <input
              type="number"
              min={1}
              value={durationHours}
              onChange={(e) =>
                setDurationHours(Math.max(1, Number(e.target.value)))
              }
              className="mt-1 w-24 border-2 border-black p-2"
            />
          </label>
          <button
            type="button"
            onClick={() => onUpdate({ quantity, durationHours })}
            disabled={updating}
            className="border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-50"
          >
            {updating ? "Saving..." : "Update"}
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={removing}
            className="border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase disabled:opacity-50"
          >
            {removing ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </article>
  );
}
