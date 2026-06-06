import { Router } from "express";
import {
  approveUser,
  assignProjectToUser,
  deleteUser,
  getPendingUsers,
  getProfile,
  getUserById,
  getUsers,
  removeProjectFromUser,
  updateMyAvailability,
  updateProfile,
  updateUser,
} from "../controllers/userController";
import { authorizeRoles, protect } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";

const router = Router();

router.get("/profile", protect(), getProfile);
router.patch("/profile", validateOrigin, protect(), updateProfile);
router.patch(
  "/profile/availability",
  validateOrigin,
  protect(),
  updateMyAvailability,
);

router.get(
  "/pending",
  protect(),
  authorizeRoles("admin", "super_admin"),
  getPendingUsers,
);
router.get("/", protect(), authorizeRoles("admin", "super_admin"), getUsers);
router.get("/:id", protect(), getUserById);
router.patch("/:id", validateOrigin, protect(), updateUser);
router.patch(
  "/:id/approve",
  validateOrigin,
  protect(),
  authorizeRoles("admin", "super_admin"),
  approveUser,
);
router.patch(
  "/:id/assign-project",
  validateOrigin,
  protect(),
  authorizeRoles("admin", "super_admin"),
  assignProjectToUser,
);
router.patch(
  "/:id/remove-project",
  validateOrigin,
  protect(),
  authorizeRoles("admin", "super_admin"),
  removeProjectFromUser,
);
router.delete(
  "/:id",
  validateOrigin,
  protect(),
  authorizeRoles("admin", "super_admin"),
  deleteUser,
);

export default router;
