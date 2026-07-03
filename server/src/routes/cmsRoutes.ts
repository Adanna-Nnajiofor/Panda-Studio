import { Router } from "express";
import {
  deleteCmsPage,
  getAllCmsPages,
  getPublishedCmsPage,
  upsertCmsPage,
} from "../controllers/cmsController";
import { protect } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";

const router = Router();

router.get("/pages/:slug", getPublishedCmsPage as any);

router.get(
  "/admin/pages",
  protect("admin", "super_admin"),
  getAllCmsPages as any,
);
router.put(
  "/admin/pages/:slug",
  validateOrigin,
  protect("admin", "super_admin"),
  upsertCmsPage as any,
);
router.delete(
  "/admin/pages/:slug",
  validateOrigin,
  protect("admin", "super_admin"),
  deleteCmsPage as any,
);

export default router;
