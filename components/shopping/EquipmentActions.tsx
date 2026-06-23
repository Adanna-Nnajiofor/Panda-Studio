"use client";

import { useState } from "react";
import { useAuthContext } from "../AuthProvider";
import { useShopping } from "./ShoppingProvider";
import { getErrorMessage } from "../../lib/errors";
import AuthActionModal from "../AuthActionModal";

type EquipmentActionsProps = {
  equipmentId: string;
  equipmentName?: string;
  compact?: boolean;
};

export default function EquipmentActions({
  equipmentId,
  equipmentName,
  compact = false,
}: EquipmentActionsProps) {
  const { isAuthenticated } = useAuthContext();
  const { addToCart, addToWishlist } = useShopping();

  const [cartState, setCartState] = useState<"idle" | "loading" | "done">(
    "idle",
  );
  const [wishlistState, setWishlistState] = useState<
    "idle" | "loading" | "done"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const requireAuth = (message: string, action: () => Promise<void>) => {
    if (!isAuthenticated) {
      setModalMessage(message);
      setIsAuthModalOpen(true);
      return;
    }
    void action();
  };

  const handleCart = () =>
    requireAuth("You need to log in to add items to your cart.", async () => {
      setCartState("loading");
      setError(null);
      try {
        await addToCart(equipmentId, {
          label: equipmentName,
        });
        setCartState("done");
        window.setTimeout(() => setCartState("idle"), 1800);
      } catch (err) {
        setError(getErrorMessage(err, "Could not add to cart"));
        setCartState("idle");
      }
    });

  const handleWishlist = () =>
    requireAuth("You need to log in to save items to your wishlist.", async () => {
      setWishlistState("loading");
      setError(null);
      try {
        await addToWishlist(equipmentId, {
          label: equipmentName,
        });
        setWishlistState("done");
        window.setTimeout(() => setWishlistState("idle"), 1800);
      } catch (err) {
        setError(getErrorMessage(err, "Could not add to wishlist"));
        setWishlistState("idle");
      }
    });

  const btnClass = "border-2 border-black px-3 py-2 text-xs font-black uppercase tracking-[0.16em] disabled:opacity-50 transition-all active:scale-95";

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCart}
            disabled={cartState === "loading"}
            className={`${btnClass} bg-black text-[#f2eadf] hover:bg-gray-800`}
          >
            {cartState === "loading"
              ? "Adding..."
              : cartState === "done"
                ? "Added ✓"
                : "Add to cart"}
          </button>
          <button
            type="button"
            onClick={handleWishlist}
            disabled={wishlistState === "loading"}
            className={`${btnClass} bg-white hover:bg-gray-50`}
          >
            {wishlistState === "loading"
              ? "Saving..."
              : wishlistState === "done"
                ? "Saved ♥"
                : "Wishlist"}
          </button>
        </div>
        {error ? <p className="text-xs text-red-700 font-bold">{error}</p> : null}
      </div>

      <AuthActionModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        message={modalMessage}
      />
    </>
  );
}
