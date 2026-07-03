import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  cancelContract,
  createContract,
  getContractById,
  listContracts,
  sendContract,
  signContract,
  updateContract,
} from "../controllers/contractController";

const router = express.Router();

router.get(
  "/",
  protect("admin", "super_admin", "staff", "crew"),
  listContracts,
);
router.post("/", protect("admin", "super_admin", "staff"), createContract);
router.get(
  "/:id",
  protect("admin", "super_admin", "staff", "crew"),
  getContractById,
);
router.put("/:id", protect("admin", "super_admin", "staff"), updateContract);
router.post(
  "/:id/send",
  protect("admin", "super_admin", "staff"),
  sendContract,
);
router.post(
  "/:id/sign",
  protect("admin", "super_admin", "staff", "crew"),
  signContract,
);
router.post(
  "/:id/cancel",
  protect("admin", "super_admin", "staff"),
  cancelContract,
);

export default router;
