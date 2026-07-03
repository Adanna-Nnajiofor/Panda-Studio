import { Router } from "express";
import Payment from "../models/Payment";
import type { AuthenticatedRequest } from "../types/auth";
import {
  getAllPayments,
  getBookingPayments,
  getPaymentById,
  initializePayment,
  refundPayment,
  verifyPayment,
} from "../controllers/paymentController";
import { authorizeRoles, protect } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";
import { paymentRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.use(protect());

router.get("/", async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  if (user && ["admin", "super_admin"].includes(user.role)) {
    return getAllPayments(req, res);
  }
  const payments = await Payment.find({ user: user!.id })
    .populate(
      "booking",
      "referenceNumber totalAmount bookingDate status paymentStatus",
    )
    .sort({ createdAt: -1 });
  return res.status(200).json({ success: true, payments });
});

router.get("/mine", async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const payments = await Payment.find({ user: user!.id })
    .populate(
      "booking",
      "referenceNumber totalAmount bookingDate status paymentStatus",
    )
    .sort({ createdAt: -1 });
  return res.status(200).json({ success: true, payments });
});

router.post(
  "/initialize",
  paymentRateLimiter,
  validateOrigin,
  initializePayment,
);
router.post("/verify", paymentRateLimiter, validateOrigin, verifyPayment);
router.get("/booking/:bookingId", getBookingPayments);
router.get("/:id", getPaymentById);
router.post(
  "/refund",
  paymentRateLimiter,
  validateOrigin,
  authorizeRoles("admin", "super_admin"),
  refundPayment,
);

export default router;
