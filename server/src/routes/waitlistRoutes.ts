import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";
import {
  joinWaitlist,
  getMyWaitlist,
  leaveWaitlist,
  notifyWaitlistForSlot,
} from "../controllers/waitlistController";

const router = Router();

router.post("/", validateOrigin, protect(), joinWaitlist);
router.get("/my", protect(), getMyWaitlist);
router.delete("/:id", validateOrigin, protect(), leaveWaitlist);
router.post(
  "/notify-slot",
  validateOrigin,
  protect(),
  authorizeRoles("admin", "super_admin"),
  notifyWaitlistForSlot,
);

export default router;
