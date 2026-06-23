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
  type WishlistItem,
  type WishlistResponse,
} from "../../lib/shopping";

export default function WishlistClient() {
  const router = useRouter();
  const { refresh: refreshCounts } = useShopping();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [moving, setMoving] = useState(false);

  const refresh = async () => {
    const data = await apiJson<WishlistResponse>("/wishlist");
    setItems(data.wishlist.items);
    await refreshCounts();
  };

  useEffect(() => {
    const run = async () => {
      try {
        setError(null);
        await refresh();
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load wishlist"));
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
    next: { quantity?: number; durationHours?: number },
  ) => {
    setError(null);
    try {
      await apiJson(`/wishlist/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(next),
      });
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update wishlist item"));
    }
  };

  const removeItem = async (itemId: string) => {
    setError(null);
    try {
      await apiJson(`/wishlist/items/${itemId}`, { method: "DELETE" });
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to remove wishlist item"));
    }
  };

  const moveAllToCart = async () => {
    setMoving(true);
    setError(null);
    try {
      await apiJson("/wishlist/move-to-cart", { method: "POST" });
      await refreshCounts();
      router.push("/cart");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to move wishlist to cart"));
    } finally {
      setMoving(false);
    }
  };

  return (
    <RoleGate allowedRoles={["client", "admin", "super_admin", "staff"]}>
      <DashboardShell
        kicker="Saved gear"
        title="Wishlist"
        summary="Keep equipment for later and move everything to your cart when you're ready to book."
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-4">
            {loading ? (
              <p className="text-sm">Loading wishlist...</p>
            ) : error ? (
              <p className="border-2 border-red-600 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </p>
            ) : !hasItems ? (
              <div className="border-4 border-black bg-white p-10 text-center shadow-[8px_8px_0_0_#000]">
                <p className="text-xl font-black uppercase">Nothing saved yet</p>
                <p className="mt-2 text-sm">
                  Tap the heart on any equipment card to save it here.
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
                <WishlistRow
                  key={item._id}
                  item={item}
                  onUpdate={(next) => updateItem(item._id, next)}
                  onRemove={() => removeItem(item._id)}
                />
              ))
            )}
          </section>

          <aside className="h-fit border-4 border-black bg-[#f6e9d7] p-5 shadow-[8px_8px_0_0_#000]">
            <p className="text-xs font-black uppercase tracking-[0.24em]">
              Quick actions
            </p>
            <p className="mt-3 text-sm">
              {items.length} saved item{items.length === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              disabled={!hasItems || moving}
              onClick={moveAllToCart}
              className="mt-6 w-full border-2 border-black bg-black px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#f2eadf] disabled:opacity-50"
            >
              {moving ? "Moving..." : "Move all to cart"}
            </button>
            <Link
              href="/cart"
              className="mt-3 block w-full border-2 border-black bg-white px-4 py-3 text-center text-xs font-black uppercase tracking-[0.16em]"
            >
              Go to cart
            </Link>
          </aside>
        </div>
      </DashboardShell>
    </RoleGate>
  );
}

function WishlistRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: WishlistItem;
  onUpdate: (next: { quantity?: number; durationHours?: number }) => void;
  onRemove: () => void;
}) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [durationHours, setDurationHours] = useState(item.durationHours);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  return (
    <article className="border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em]">
            Saved gear
          </p>
          <h2 className="mt-1 text-lg font-black uppercase">
            {item.equipment.name ?? "Equipment"}
          </h2>
          <p className="mt-2 text-sm">
            {formatNaira(item.equipment.hourlyRate ?? 0)}/hr
            {item.savedAt
              ? ` · Saved ${new Date(item.savedAt).toLocaleDateString()}`
              : ""}
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
            onClick={async () => {
              setSaving(true);
              try {
                await onUpdate({ quantity, durationHours });
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving || removing}
            className="border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Update"}
          </button>
          <button
            type="button"
            onClick={async () => {
              setRemoving(true);
              try {
                await onRemove();
              } finally {
                setRemoving(false);
              }
            }}
            disabled={removing || saving}
            className="border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase disabled:opacity-50"
          >
            {removing ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </article>
  );
}
