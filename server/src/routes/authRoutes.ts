import { Router } from "express";
import {
  register,
  login,
  me,
  logout,
  refreshAuth,
  createStaffUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  getMySessions,
  revokeSession,
  revokeOtherSessions,
  getLoginHistory,
} from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";
import {
  authLoginRateLimiter,
  authSensitiveRateLimiter,
} from "../middleware/rateLimiter";

const router = Router();

// Public
router.post("/register", register);
router.post("/login", authLoginRateLimiter, login);
router.post("/verify-email", verifyEmail);
router.post(
  "/resend-verification",
  authSensitiveRateLimiter,
  resendVerification,
);
router.post("/forgot-password", authSensitiveRateLimiter, forgotPassword);
router.post("/reset-password", authSensitiveRateLimiter, resetPassword);

// Protected
router.post("/logout", protect(), logout);
router.get("/me", protect(), me);
router.get("/profile", protect(), me);
router.get("/refresh", protect(), refreshAuth);
router.post("/change-password", validateOrigin, protect(), changePassword);
router.post("/create-user", protect("admin", "super_admin"), createStaffUser);
router.post("/2fa/setup", validateOrigin, protect(), setupTwoFactor);
router.post("/2fa/enable", validateOrigin, protect(), enableTwoFactor);
router.post("/2fa/disable", validateOrigin, protect(), disableTwoFactor);
router.get("/sessions", protect(), getMySessions);
router.delete("/sessions/:sessionId", validateOrigin, protect(), revokeSession);
router.delete("/sessions", validateOrigin, protect(), revokeOtherSessions);
router.get("/login-history", protect(), getLoginHistory);

export default router;
