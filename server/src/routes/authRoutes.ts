import { Router } from "express";
import {
  getMe,
  login,
  logoutUser,
  refreshAuth,
  register,
} from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

/* -----------------------------
   PUBLIC ROUTES 
------------------------------ */
router.post("/register", register);
router.post("/login", login);

/* -----------------------------
   PROTECTED ROUTES
------------------------------ */
router.post("/logout", protect(), logoutUser);
router.get("/me", protect(), getMe);
router.get("/profile", protect(), getMe);
router.get("/refresh", protect(), refreshAuth);

export default router;
