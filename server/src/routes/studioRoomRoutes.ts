import { Router } from "express";
import {
  createStudioRoom,
  deleteStudioRoom,
  getFeaturedStudioRooms,
  getStudioRoomsAdmin,
  getStudioRooms,
  getStudioRoomById,
  reorderStudioRoomImages,
  removeStudioRoomImage,
  updateStudioRoom,
  uploadStudioRoomImages,
} from "../controllers/studioRoomController";
import { protect, authorizeRoles } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();

// Public read
router.get("/", getStudioRooms);
router.get("/featured", getFeaturedStudioRooms);

// Admin read
router.get(
  "/admin/list",
  authorizeRoles("admin", "super_admin"),
  getStudioRoomsAdmin as any,
);
router.get("/:id", getStudioRoomById);

// Admin CRUD
router.post(
  "/",
  validateOrigin,
  authorizeRoles("admin", "super_admin"),
  createStudioRoom as any,
);
router.patch(
  "/:id",
  validateOrigin,
  authorizeRoles("admin", "super_admin"),
  updateStudioRoom as any,
);
router.delete(
  "/:id",
  validateOrigin,
  authorizeRoles("admin", "super_admin"),
  deleteStudioRoom as any,
);
router.post(
  "/:id/images",
  validateOrigin,
  authorizeRoles("admin", "super_admin"),
  upload.array("images", 10),
  uploadStudioRoomImages as any,
);
router.delete(
  "/:id/images",
  validateOrigin,
  authorizeRoles("admin", "super_admin"),
  removeStudioRoomImage as any,
);
router.patch(
  "/:id/images/reorder",
  validateOrigin,
  authorizeRoles("admin", "super_admin"),
  reorderStudioRoomImages as any,
);

export default router;
