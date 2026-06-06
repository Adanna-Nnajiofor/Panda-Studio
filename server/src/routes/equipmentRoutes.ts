import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createEquipment,
  getEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  uploadEquipmentImages,
} from "../controllers/equipmentController";
import { validateOrigin } from "../middleware/csrfMiddleware";
import { upload } from "../middleware/uploadMiddleware";

const router = express.Router();

router.get("/", getEquipment as any);
router.get("/:id", getEquipmentById as any);
router.post("/", validateOrigin, protect("admin", "super_admin"), createEquipment as any);
router.patch("/:id", validateOrigin, protect("admin", "super_admin"), updateEquipment as any);
router.delete("/:id", validateOrigin, protect("admin", "super_admin"), deleteEquipment as any);
router.post("/:id/images", validateOrigin, protect("admin", "super_admin"), upload.array("images", 5), uploadEquipmentImages as any);

export default router;
