import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  getAuditLogs,
  getAuditRetentionPolicy,
  purgeExpiredAuditLogs,
} from "../controllers/auditLogController";

const router = express.Router();
const adminOnly = protect("admin", "super_admin");

router.get("/", adminOnly, getAuditLogs);
router.get("/policy", adminOnly, getAuditRetentionPolicy);
router.delete("/purge-expired", adminOnly, purgeExpiredAuditLogs);

export default router;
