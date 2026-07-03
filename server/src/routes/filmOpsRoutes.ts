import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  addAttendanceEntry,
  addCallSheet,
  addDailyProductionReport,
  addLocationEntry,
  addTalentEntry,
  createFilmOpsProject,
  getFilmOpsProject,
  listFilmOpsProjects,
} from "../controllers/filmOpsController";

const router = express.Router();
const manageRoles = protect("admin", "super_admin", "staff");

router.get("/projects", protect(), listFilmOpsProjects);
router.post("/projects", manageRoles, createFilmOpsProject);
router.get("/projects/:id", protect(), getFilmOpsProject);

router.post("/projects/:id/call-sheets", manageRoles, addCallSheet);
router.post("/projects/:id/dprs", manageRoles, addDailyProductionReport);
router.post("/projects/:id/attendance", manageRoles, addAttendanceEntry);
router.post("/projects/:id/locations", manageRoles, addLocationEntry);
router.post("/projects/:id/talents", manageRoles, addTalentEntry);

export default router;
