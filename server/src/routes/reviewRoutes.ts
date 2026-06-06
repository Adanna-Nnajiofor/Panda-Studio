import { Router } from "express";
import { createReview, getCrewReviews } from "../controllers/reviewController";
import { protect } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";

const router = Router();

router.get("/crew/:crewId", getCrewReviews);
router.post("/", validateOrigin, protect(), createReview);

export default router;
