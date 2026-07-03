import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  deleteSetting,
  getPublicSettings,
  getSettingByKey,
  listSettings,
  upsertSetting,
} from "../controllers/settingController";

const router = Router();

router.get("/public", getPublicSettings as any);
router.get("/", protect("super_admin"), listSettings as any);
router.get("/:key", protect("super_admin"), getSettingByKey as any);
router.put("/", protect("super_admin"), upsertSetting as any);
router.delete("/:key", protect("super_admin"), deleteSetting as any);

export default router;
