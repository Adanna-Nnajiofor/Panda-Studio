import { Router } from "express";
import {
  createRental,
  getAllRentals,
  getMyRentals,
  updateRentalStatus,
} from "../controllers/rentalController";
import { protect } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();

router.use(protect());

router.post(
  "/",

  upload.fields([
    { name: "identityDocument", maxCount: 1 },
    { name: "profilePhoto", maxCount: 1 },
  ]),
  createRental,
);
router.get("/mine", getMyRentals);
router.get("/", getAllRentals);
router.patch("/:id/status", validateOrigin, updateRentalStatus);

export default router;
