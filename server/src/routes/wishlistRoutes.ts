import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";
import {
  addWishlistItem,
  getWishlist,
  moveWishlistToCart,
  removeWishlistItem,
  updateWishlistItem,
} from "../controllers/wishlistController";

const router = Router();

router.use(protect());

router.get("/", getWishlist);

router.post("/items", validateOrigin, addWishlistItem);
router.patch("/items/:itemId", validateOrigin, updateWishlistItem);
router.delete("/items/:itemId", validateOrigin, removeWishlistItem);

// UX: move entire wishlist to cart
router.post("/move-to-cart", validateOrigin, moveWishlistToCart);

export default router;
