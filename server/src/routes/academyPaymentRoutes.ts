import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  getMyAcademyPayments,
  initializeAcademyPayment,
  verifyAcademyPayment,
} from "../controllers/academyPaymentController";
import { validateOrigin } from "../middleware/csrfMiddleware";
import { paymentRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.use(protect());
router.get("/mine", getMyAcademyPayments as any);
router.post(
  "/initialize",
  paymentRateLimiter,
  validateOrigin,
  initializeAcademyPayment as any,
);
router.post(
  "/verify",
  paymentRateLimiter,
  validateOrigin,
  verifyAcademyPayment as any,
);

export default router;
