import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createEquipmentBooking,
  listEquipmentBookings,
  updateEquipmentBookingStatus,
} from "../controllers/equipmentBookingController";

const router = Router();

router.get("/", protect(), listEquipmentBookings as any);
router.post("/", protect(), createEquipmentBooking as any);
router.patch(
  "/:id/status",
  protect("admin", "super_admin", "staff"),
  updateEquipmentBookingStatus as any,
);

export default router;
