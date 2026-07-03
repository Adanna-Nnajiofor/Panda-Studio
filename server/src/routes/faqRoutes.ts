import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createFaq,
  deleteFaq,
  getAllFaqs,
  getPublishedFaqs,
  updateFaq,
} from "../controllers/faqController";

const router = Router();

router.get("/", getPublishedFaqs as any);
router.get("/admin", protect("admin", "super_admin"), getAllFaqs as any);
router.post("/", protect("admin", "super_admin"), createFaq as any);
router.patch("/:id", protect("admin", "super_admin"), updateFaq as any);
router.delete("/:id", protect("admin", "super_admin"), deleteFaq as any);

export default router;
