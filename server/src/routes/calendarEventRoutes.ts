import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  listCalendarEvents,
  syncCalendarEvents,
  updateCalendarEvent,
} from "../controllers/calendarEventController";

const router = express.Router();

router.get("/", protect(), listCalendarEvents);
router.post("/", protect("admin", "super_admin", "staff"), createCalendarEvent);
router.post("/sync", protect(), syncCalendarEvents);
router.patch(
  "/:id",
  protect("admin", "super_admin", "staff"),
  updateCalendarEvent,
);
router.delete(
  "/:id",
  protect("admin", "super_admin", "staff"),
  deleteCalendarEvent,
);

export default router;
