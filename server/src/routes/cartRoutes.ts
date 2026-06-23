import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  addItemToCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../controllers/cartController";

const router = Router();

// correct: call it
router.use(protect());

router.get("/", getCart);

router.post("/items", addItemToCart);
router.patch("/items/:itemId", updateCartItem);
router.delete("/items/:itemId", removeCartItem);

export default router;
