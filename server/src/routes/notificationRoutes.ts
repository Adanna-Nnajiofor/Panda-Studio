import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware";
import { sendBookingRemindersAdmin } from "../controllers/notificationController";
import { validateOrigin } from "../middleware/csrfMiddleware";

const router = Router();

// Admin-only reminder dispatch
router.post(
  "/send-booking-reminders",
  validateOrigin,
  protect(),
  authorizeRoles("admin", "super_admin"),
  sendBookingRemindersAdmin,
);

export default router;
