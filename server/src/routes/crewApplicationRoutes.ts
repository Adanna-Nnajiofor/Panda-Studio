import { Router } from "express";
import {
  approveCrewApplication,
  getMyApplication,
  listCrewApplications,
  rejectCrewApplication,
  submitCrewApplication,
} from "../controllers/crewApplicationController";
import { authorizeRoles, protect } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";

const router = Router();

// Client routes
router.post("/", validateOrigin, protect(), submitCrewApplication);
router.get("/my", protect(), getMyApplication);

// Admin routes
router.get(
  "/",
  protect(),
  authorizeRoles("admin", "super_admin"),
  listCrewApplications,
);
router.patch(
  "/:id/approve",
  validateOrigin,
  protect(),
  authorizeRoles("admin", "super_admin"),
  approveCrewApplication,
);
router.patch(
  "/:id/reject",
  validateOrigin,
  protect(),
  authorizeRoles("admin", "super_admin"),
  rejectCrewApplication,
);

export default router;
