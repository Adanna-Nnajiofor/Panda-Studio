import { Router } from "express";
import {
  createReview,
  getCrewReviews,
  getEquipmentReviews,
  getServiceReviews,
  getStudioRoomReviews,
} from "../controllers/reviewController";
import { protect } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";

const router = Router();

router.get("/crew/:crewId", getCrewReviews);
router.get("/service/:serviceId", getServiceReviews);
router.get("/equipment/:equipmentId", getEquipmentReviews);
router.get("/studio-room/:roomId", getStudioRoomReviews);
router.post("/", validateOrigin, protect(), createReview);

export default router;
