import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  generateCallSheetDraft,
  breakdownScript,
  generateDailyProductionReportDraft,
  getSmartScheduleSuggestions,
  generateContract,
  generateContractPdf,
  generateProductionRiskReport,
  generateShotListDraft,
} from "../controllers/aiController";

const router = express.Router();

router.post("/script-breakdown", protect(), breakdownScript);
router.post(
  "/smart-schedule",
  protect("admin", "super_admin", "staff"),
  getSmartScheduleSuggestions,
);
router.post(
  "/generate-contract",
  protect("admin", "super_admin", "staff", "crew"),
  generateContract,
);
router.post(
  "/generate-contract-pdf",
  protect("admin", "super_admin", "staff", "crew"),
  generateContractPdf,
);
router.post(
  "/call-sheet",
  protect("admin", "super_admin", "staff", "crew"),
  generateCallSheetDraft,
);
router.post(
  "/shot-list",
  protect("admin", "super_admin", "staff", "crew"),
  generateShotListDraft,
);
router.post(
  "/dpr",
  protect("admin", "super_admin", "staff", "crew"),
  generateDailyProductionReportDraft,
);
router.post(
  "/production-risks",
  protect("admin", "super_admin", "staff", "crew"),
  generateProductionRiskReport,
);

export default router;
