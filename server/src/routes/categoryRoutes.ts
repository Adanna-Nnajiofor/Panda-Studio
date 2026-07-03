import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../controllers/categoryController";

const router = Router();

router.get("/", listCategories as any);
router.post("/", protect("admin", "super_admin"), createCategory as any);
router.patch("/:id", protect("admin", "super_admin"), updateCategory as any);
router.delete("/:id", protect("admin", "super_admin"), deleteCategory as any);

export default router;
