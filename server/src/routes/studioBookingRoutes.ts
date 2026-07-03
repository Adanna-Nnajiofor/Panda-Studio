import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createStudioBooking,
  listStudioBookings,
  updateStudioBookingStatus,
} from "../controllers/studioBookingController";

const router = Router();

router.get("/", protect(), listStudioBookings as any);
router.post("/", protect(), createStudioBooking as any);
router.patch(
  "/:id/status",
  protect("admin", "super_admin", "staff"),
  updateStudioBookingStatus as any,
);

export default router;
