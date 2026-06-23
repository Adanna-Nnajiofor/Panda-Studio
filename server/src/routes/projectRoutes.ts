import { Router } from "express";
import {
  assignProjectMembers,
  createProject,
  deleteProject,
  getMyProjects,
  getProjectById,
  getProjects,
  updateProject,
  updateProjectWorkflow,
} from "../controllers/projectController";
import { authorizeRoles, protect } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";

const router = Router();

// Public browse endpoints
router.get("/", getProjects as any);
router.get("/:id", getProjectById as any);

// Auth-only endpoints
router.get("/mine", protect(), getMyProjects as any);

// Writes (auth + roles)

router.post(
  "/",
  validateOrigin,
  authorizeRoles("admin", "super_admin"),
  createProject,
);
router.put(
  "/:id",
  validateOrigin,
  authorizeRoles("admin", "super_admin"),
  updateProject,
);
router.delete(
  "/:id",
  validateOrigin,
  authorizeRoles("admin", "super_admin"),
  deleteProject,
);
router.patch(
  "/:id/assign",
  validateOrigin,
  authorizeRoles("admin", "super_admin"),
  assignProjectMembers,
);
router.patch(
  "/:id/workflow",
  validateOrigin,
  authorizeRoles("crew", "staff", "admin", "super_admin"),
  updateProjectWorkflow,
);

export default router;
