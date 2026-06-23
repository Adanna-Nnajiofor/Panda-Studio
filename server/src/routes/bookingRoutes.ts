import { Router } from "express";
import type { AuthenticatedRequest } from "../types/auth";
import {
  cancelBooking,
  createBooking,
  getAllBookings,
  getBookingById,
  getUserBookings,
  updateBookingStatus,
} from "../controllers/bookingController";
import { authorizeRoles, protect } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";

const router = Router();

// Booking listing and viewing are protected. Public browse should not expose booking data.
// Booking creation and actions are also protected.
router.post("/", validateOrigin, protect(), createBooking);

router.get("/", protect(), (req, res) => {
  const { user } = req as AuthenticatedRequest;

  if (user && ["admin", "super_admin"].includes(user.role)) {
    return getAllBookings(req as AuthenticatedRequest, res);
  }

  return getUserBookings(req as AuthenticatedRequest, res);
});

router.get("/mine", protect(), getUserBookings);
router.get("/:id", protect(), getBookingById);
router.patch(
  "/:id/status",
  validateOrigin,
  authorizeRoles("crew", "staff", "admin", "super_admin"),
  updateBookingStatus,
);
router.patch("/:id/cancel", validateOrigin, protect(), cancelBooking);

export default router;
