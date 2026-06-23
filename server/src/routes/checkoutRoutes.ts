import { Router } from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";
import {
  confirmCheckout,
  verifyIdUpload,
} from "../controllers/checkoutController";

const router = Router();
router.use(protect());

// Using memory storage to keep it simple. Existing cloudinary util should accept buffer.
const upload = multer({ storage: multer.memoryStorage() });

// Upload ID file under field name: `idFile`
router.post(
  "/verify-id",
  upload.single("idFile"),
  validateOrigin,
  verifyIdUpload,
);

router.post("/confirm", validateOrigin, confirmCheckout);

export default router;
