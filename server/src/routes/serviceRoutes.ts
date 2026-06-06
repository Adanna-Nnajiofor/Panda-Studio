import express from "express";
import { protect } from "../middleware/authMiddleware";
import { createService, getServices } from "../controllers/serviceController";
import { validateOrigin } from "../middleware/csrfMiddleware";

const router = express.Router();

router.use(validateOrigin);

router.get("/", getServices as any);
router.post("/", protect("admin", "super_admin"), createService as any);

export default router;
