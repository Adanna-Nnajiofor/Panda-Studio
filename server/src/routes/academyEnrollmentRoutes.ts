import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  enrollInCourse,
  getMyEnrollmentById,
  getMyEnrollments,
} from "../controllers/academyEnrollmentController";

const router = Router();

router.use(protect());
router.get("/mine", getMyEnrollments as any);
router.get("/:id", getMyEnrollmentById as any);
router.post("/", enrollInCourse as any);

export default router;
