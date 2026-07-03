import express from "express";
import { searchCrew, searchGlobal } from "../controllers/searchController";

const router = express.Router();

router.get("/", searchGlobal as any);
router.get("/global", searchGlobal as any);
router.get("/crew", searchCrew as any);
router.get("/equipment", searchGlobal as any);
router.get("/projects", searchGlobal as any);
router.get("/bookings", searchGlobal as any);
router.get("/invoices", searchGlobal as any);
router.get("/clients", searchGlobal as any);

export default router;
