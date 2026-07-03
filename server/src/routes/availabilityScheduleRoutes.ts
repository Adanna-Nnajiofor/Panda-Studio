import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  deleteMyAvailabilitySchedule,
  getMyAvailabilitySchedule,
  getUserAvailabilitySchedule,
  upsertMyAvailabilitySchedule,
} from "../controllers/availabilityScheduleController";

const router = Router();

router.get("/me", protect(), getMyAvailabilitySchedule as any);
router.put("/me", protect(), upsertMyAvailabilitySchedule as any);
router.delete("/me/:id", protect(), deleteMyAvailabilitySchedule as any);
router.get("/users/:userId", protect(), getUserAvailabilitySchedule as any);

export default router;
