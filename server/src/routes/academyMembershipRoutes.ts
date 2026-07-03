import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createMembershipPlan,
  getMyMembership,
  initializeMembershipPayment,
  listMembershipPlans,
  listMembershipPlansAdmin,
  updateMembershipPlan,
  verifyMembershipPayment,
} from "../controllers/academyMembershipController";
import { paymentRateLimiter } from "../middleware/rateLimiter";
import { validateOrigin } from "../middleware/csrfMiddleware";

const router = Router();

router.get("/plans", listMembershipPlans as any);
router.get("/my", protect(), getMyMembership as any);
router.get(
  "/admin/plans",
  protect("admin", "super_admin"),
  listMembershipPlansAdmin as any,
);
router.post(
  "/plans",
  protect("admin", "super_admin"),
  createMembershipPlan as any,
);
router.patch(
  "/plans/:id",
  protect("admin", "super_admin"),
  updateMembershipPlan as any,
);

router.post(
  "/initialize",
  protect(),
  paymentRateLimiter,
  validateOrigin,
  initializeMembershipPayment as any,
);
router.post(
  "/verify",
  protect(),
  paymentRateLimiter,
  validateOrigin,
  verifyMembershipPayment as any,
);

export default router;
