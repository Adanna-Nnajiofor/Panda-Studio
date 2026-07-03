import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createAward,
  deleteAward,
  getAllAwards,
  getPublishedAwards,
  updateAward,
} from "../controllers/awardController";

const router = Router();

router.get("/", getPublishedAwards as any);
router.get("/admin", protect("admin", "super_admin"), getAllAwards as any);
router.post("/", protect("admin", "super_admin"), createAward as any);
router.patch("/:id", protect("admin", "super_admin"), updateAward as any);
router.delete("/:id", protect("admin", "super_admin"), deleteAward as any);

export default router;
