import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createAcademyCategory,
  createAcademyCourse,
  createAcademyLesson,
  createAcademyModule,
  getAcademyCourseById,
  getAcademyCourseOutline,
  listAcademyCategories,
  listAcademyCourses,
  publishAcademyCourse,
  updateAcademyCourse,
} from "../controllers/academyCourseController";

const router = Router();

router.get("/categories", listAcademyCategories as any);
router.get("/", listAcademyCourses as any);
router.get("/:idOrSlug/outline", getAcademyCourseOutline as any);
router.get("/:idOrSlug", getAcademyCourseById as any);

router.post(
  "/categories",
  protect("admin", "super_admin"),
  createAcademyCategory as any,
);
router.post("/", protect("admin", "super_admin"), createAcademyCourse as any);
router.patch(
  "/:id",
  protect("admin", "super_admin"),
  updateAcademyCourse as any,
);
router.post(
  "/:id/publish",
  protect("admin", "super_admin"),
  publishAcademyCourse as any,
);

router.post(
  "/:courseId/modules",
  protect("admin", "super_admin"),
  createAcademyModule as any,
);
router.post(
  "/:courseId/lessons",
  protect("admin", "super_admin"),
  createAcademyLesson as any,
);

export default router;
