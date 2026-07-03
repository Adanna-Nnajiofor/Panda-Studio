import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";
import {
  getMyNotifications,
  markOneRead,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
  sendBookingRemindersAdmin,
} from "../controllers/notificationController";

const router = Router();

router.get("/", protect(), getMyNotifications);
router.patch("/read-all", validateOrigin, protect(), markAllRead);
router.patch("/:id/read", validateOrigin, protect(), markOneRead);
router.delete("/", validateOrigin, protect(), clearAllNotifications);
router.delete("/:id", validateOrigin, protect(), deleteNotification);

router.post(
  "/send-booking-reminders",
  validateOrigin,
  protect(),
  authorizeRoles("admin", "super_admin"),
  sendBookingRemindersAdmin,
);

export default router;
