import express from "express";
import { searchGlobal } from "../controllers/searchController";

const router = express.Router();

router.get("/", searchGlobal as any);

export default router;
