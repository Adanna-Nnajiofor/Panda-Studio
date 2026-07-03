import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  getCourseProgress,
  upsertLessonProgress,
} from "../controllers/academyProgressController";

const router = Router();

router.use(protect());
router.get("/:courseId", getCourseProgress as any);
router.post("/lesson", upsertLessonProgress as any);

export default router;
